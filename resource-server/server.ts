// ----------- Imports ---------------
import express from "express";
import { MongoClient } from "mongodb";
import { createClient } from "redis";
import TokenRepository from "./src/repositories/TokenRepository.js";
import { createTimeToLiveIndex } from "./src/utils/ConfigFunctions.js";
import TokenAuthMiddleware from "./src/middlewares/TokenAuthMiddleware.js";
import UserController from "./src/controllers/UserController.js";
import UserService from "./src/services/UserService.js";
import UserRepository from "./src/repositories/UserRepository.js";
import { config } from "dotenv";

// ----------- Configuration ---------------
const app = express();
app.use(express.json());
config({ path: ".env" });


// ----------- Main Function ---------------
async function boot (){
    try {
        // ----------- Database Connection ---------------
        const mongoConnection = await MongoClient.connect(process.env.MONGO_DB);
        const mongoDb = mongoConnection.db("truth");
        console.log("MongoDB Connected Successfully");

        const redisConnection = createClient({ url: process.env.REDIS_DB });
        await redisConnection.connect();
        console.log("Redis Connected Successfully");
        
        // ----------- Indexes ---------------
        await createTimeToLiveIndex(mongoDb, "accessTokens", "expiresAt");
        await createTimeToLiveIndex(mongoDb, "refreshTokens", "expiresAt");

        // ----------- Instances ---------------
        const tokenRepository = new TokenRepository(mongoDb, redisConnection);
        const userRepository = new UserRepository(mongoDb);

        const userService = new UserService(userRepository);

        const tokenAuthMiddleware = new TokenAuthMiddleware(tokenRepository);
        const userController = new UserController(userService);

        // ----------- Routes ---------------
        app.get("/resource", tokenAuthMiddleware.verifyAccessToken, userController.resource);

        app.get("/", (_req, res) => {
            res.send("Resource Server is Running!!");
        })

        // ----------- Server ---------------
        app.listen(process.env.PORT, () => {
            console.log("Server started on port", process.env.PORT);
        });

        // ----------- Shutdown Cleanup ---------------
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

// ----------- Execution ---------------
boot();