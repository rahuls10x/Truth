// ------------- Imports ---------------
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { config } from "dotenv";
import { MongoClient } from "mongodb";
import { createClient } from "redis";
import AuthController from "./src/controllers/AuthController.js";
import AuthService from "./src/services/AuthService.js";
import TokenRepository from "./src/repositories/TokenRepository.js";
import ClientRepository from "./src/repositories/ClientRepository.js";
import { createTimeToLiveIndex, createUniqueIndex } from "./src/utils/ConfigFunctions.js";
import ValidationMiddlewares from "./src/middlewares/ValidationMiddlewares.js";
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

// ------------- Configuration ---------------
const app = express();
app.use(express.json());
app.use(cookieParser());
config({ path: ".env" });
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

        const authService = new AuthService(sessionRepository, userRepository, orgRepository);
        const userService = new UserService(userRepository);
        const orgService = new OrganizationService(orgRepository, clientRepository);
        const oAuthService = new OAuthService(clientRepository, tokenRepository, consentRepository);

        const authController = new AuthController(authService);
        const userController = new UserController(userService);
        const orgController = new OrganizationController(orgService);
        const oAuthController = new OAuthController(oAuthService);

        const authMiddleware = new TokenAuthMiddleware(sessionRepository);
        const validationMiddleware = new ValidationMiddlewares();

        // ------------- Routes ---------------
        app.get("/user/profile", authMiddleware.checkUserAuthToken, userController.getProfile);
        app.put("/user/profile", authMiddleware.checkUserAuthToken, validationMiddleware.validateUpdateProfile, userController.updateProfile);

        app.get("/org/clients", authMiddleware.checkOrganizationAuthToken, orgController.getClients);
        app.post("/org/clients", authMiddleware.checkOrganizationAuthToken, validationMiddleware.validateCreateClient, orgController.createClient);

        app.post("/user/signup", validationMiddleware.userSignup, userController.signupRequest);
        app.post("/org/signup", validationMiddleware.orgSignup, orgController.signupRequest);

        app.post("/user/login", validationMiddleware.login, authController.userLogin);
        app.post("/org/login", validationMiddleware.login, authController.organizationLogin);

        app.get("/logout", authMiddleware.checkAuthToken, authController.logout);

        app.get("/whoAmI", authMiddleware.checkAuthToken, authController.whoAmI);

        //------------- OAuth ---------------
        app.post("/consent", validationMiddleware.consent, authMiddleware.checkUserAuthToken, oAuthController.consent);
        app.get("/authorize", validationMiddleware.authorize, authMiddleware.checkUserAuthToken, oAuthController.authorize );
        app.post("/token", validationMiddleware.tokenize, oAuthController.tokenize);
        app.get("/refresh", validationMiddleware.refreshToken, oAuthController.refreshToken);

        app.get("/", (_req, res) => {
            res.send("Server is Running!!");
        })

        // ------------- Server Start ---------------
        app.listen(process.env.PORT, () => {
            console.log("Server started on port", process.env.PORT);
        });

        // ------------- Shutdown ---------------
        process.on("SIGINT", async () => {
            await mongoConnection.close();
            await redisConnection.disconnect();
            console.log("Database disconnected successfully");
            process.exit(0);
        });
        process.on("SIGTERM", async () => {
            await mongoConnection.close();
            await redisConnection.disconnect();
            console.log("Database disconnected successfully");
            process.exit(0);
        });

    } catch (error) {
        console.error(error);
    }
}
boot();
