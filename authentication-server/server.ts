// ------------- Imports ---------------
import express from "express";
import cors from "cors";
import http from 'http';
import cookieParser from "cookie-parser";
import { config } from "dotenv";
import { MongoClient } from "mongodb";
import { createClient } from "redis";
import AuthController from "./src/controllers/AuthController.js";
import AuthService from "./src/services/AuthService.js";
import TokenRepository from "./src/repositories/TokenRepository.js";
import ClientRepository from "./src/repositories/ClientRepository.js";
import { createTimeToLiveIndex, createUniqueIndex } from "./src/utils/ConfigFunctions.js";
import UserController from "./src/controllers/UserController.js";
import UserService from "./src/services/UserService.js";
import UserRepository from "./src/repositories/UserRepository.js";
import OrganizationController from "./src/controllers/OrganizationController.js";
import OrganizationService from "./src/services/OrganizationService.js";
import OrganizationRepository from "./src/repositories/OrganizationRepository.js";
import SessionRepository from "./src/repositories/SessionRepository.js";
import OAuthController from "./src/controllers/OAuthController.js";
import OAuthService from "./src/services/OAuthService.js";
import ConsentRepository from "./src/repositories/ConsentRepository.js";
import TokenAuthMiddleware from "./src/middlewares/TokenAuthMiddleware.js";
import LinkRepository from "./src/repositories/LinkRepository.js";
import MailService from "./src/services/MailService.js";
import LinkService from "./src/services/LinkSevice.js";
import { Server } from "socket.io";
import type { AppSocket } from "./src/types/socketTypes.js";
import { JoinSocketRooms, SocketRoutes } from "./src/routes/socket.js";

// ------------- Configuration ---------------
config({ path: ".env" });

const originUrl = process.env.ORIGIN_URL || "http://localhost:5173";
const port = process.env.PORT || 4000

const app = express();
// Wrap Express in HTTP server to share the TCP listener and port with Socket.io
const httpServer = http.createServer(app);
const socketIo = new Server(httpServer, {
	cors: {
		origin: originUrl,
		credentials: true,
	},
});

app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: process.env.ORIGIN_URL,
    credentials: true
}));


// ------------- Main Function ---------------
async function boot (){
    try {
        // ------------- Database Connection ---------------
        const mongoConnection = await MongoClient.connect(process.env.MONGO_DB);
        const mongoDb = mongoConnection.db("truth");
        console.log("MongoDB Connected Successfully");

        const redisConnection = createClient({ url: process.env.REDIS_DB });
        await redisConnection.connect();
        console.log("Redis Connected Successfully");

        // ------------- Database Configuration ---------------
        await createTimeToLiveIndex(mongoDb, "accessTokens", "expiresAt");
        await createTimeToLiveIndex(mongoDb, "refreshTokens", "expiresAt");
        await createTimeToLiveIndex(mongoDb, "sessions", "expiresAt");

        await createUniqueIndex(mongoDb, 'users', 'email');
        await createUniqueIndex(mongoDb, 'organizations', 'email');
        await createUniqueIndex(mongoDb, 'sessions', 'sessionId');
        await createUniqueIndex(mongoDb, 'applications', 'clientId');
        await createUniqueIndex(mongoDb, 'accessTokens', 'tokenString');
        await createUniqueIndex(mongoDb, 'refreshTokens', 'tokenString');


        // ------------- Instances ---------------
        const tokenRepository = new TokenRepository(mongoDb, redisConnection);
        const clientRepository = new ClientRepository(mongoDb);
        const userRepository = new UserRepository(mongoDb);
        const orgRepository = new OrganizationRepository(mongoDb);
        const sessionRepository = new SessionRepository(mongoDb);
        const consentRepository = new ConsentRepository(mongoDb);
        const linkRepository = new LinkRepository(redisConnection);

        const mailService = new MailService(process.env.ORIGIN_URL);
        const linkService = new LinkService(linkRepository);
        const authService = new AuthService(sessionRepository, userRepository, orgRepository, linkRepository);
        const userService = new UserService(userRepository, linkService, mailService);
        const orgService = new OrganizationService(orgRepository, clientRepository, linkService, mailService);
        const oAuthService = new OAuthService(clientRepository, tokenRepository, consentRepository);

        const authController = new AuthController(authService);
        const userController = new UserController(userService);
        const orgController = new OrganizationController(orgService);
        const oAuthController = new OAuthController(oAuthService);

        const authMiddleware = new TokenAuthMiddleware(sessionRepository);

        // ------------- WebsocketEvents --------------
		socketIo.use((socket, next) => authMiddleware.checkSocketToken(socket, next));

		socketIo.on("connection", (socket: AppSocket) => {
			console.log(`[WebSocket] Client connected: ${socket.id} (Session: ${socket.data.sessionId}) (Entity: ${socket.data.entityId})`);

			JoinSocketRooms(socket);
			SocketRoutes(socket);
		});

        // ------------- Routes ---------------
        app.get("/user/profile", authMiddleware.checkUserAuthToken, userController.getProfile);
        app.put("/user/profile", authMiddleware.checkUserAuthToken, userController.updateProfile);

        app.get("/org/clients", authMiddleware.checkOrganizationAuthToken, orgController.getClients);
        app.post("/org/clients", authMiddleware.checkOrganizationAuthToken, orgController.createClient);

        app.post("/user/signup", userController.signupRequest);
        app.post("/org/signup", orgController.signupRequest);

        app.post("/user/login", authController.userLogin);
        app.post("/org/login", authController.organizationLogin);

        app.post("/user/forgotPassword", userController.forgotPassword);
        app.post("/org/forgotPassword", orgController.forgotPassword);

        app.get("/sessions", authMiddleware.checkAuthToken, authController.getSessions);
        app.delete("/revokeSession", authMiddleware.checkAuthToken, authController.revokeSession);
        app.delete("/revokeAllSessions", authMiddleware.checkAuthToken, authController.revokeAllSessions);

        app.put("/verifyEmail/:magicToken", authController.verifyEmail);

        app.patch("/resetPassword/:magicToken", authController.resetPassword);

        app.get("/logout", authMiddleware.checkAuthToken, authController.logout);

        app.get("/whoAmI", authMiddleware.checkAuthToken, authController.whoAmI);

        //------------- OAuth ---------------
        app.post("/consent", authMiddleware.checkUserAuthToken, oAuthController.consent);
        app.get("/authorize", authMiddleware.checkOAuthUserAuthToken, oAuthController.authorize );
        app.post("/tokenize", oAuthController.tokenize);
        app.post("/refresh", oAuthController.refreshToken);

        app.get("/", (_req, res) => {
            res.send("Server is Running!!");
        });

        // ------------- Server Start ---------------
		httpServer.listen(port, () => {
			console.log(`Backend server listening on port ${port}`);
		});

		// ------------- Shutdown ---------------
		process.on("SIGINT", () => {
			httpServer.close(() => {
				console.log("Server stopped gracefully");
				process.exit(0);
			});
		});

		process.on("SIGTERM", () => {
			httpServer.close(() => {
				console.log("Server stopped gracefully");
				process.exit(0);
			});
		});

    } catch (error) {
        console.error(error);
    }
}
boot();
