import type { Db } from "mongodb";
import type { createClient } from "redis";
import type { AuthenticationCode, Token } from "../types/dbSchema.js";

export default class TokenRepository{
    private db: Db 
    private cache: ReturnType<typeof createClient>

    constructor(db: Db, cache:ReturnType<typeof createClient>){
        this.db = db;
        this.cache = cache;
    }

    /**
     * Create a Authorization Code in cache
     * 
     * Inorder Flow:
     * - save the temporary code with expiry and return status
     */
    async cacheAuthorizationCode(key:string, payload:AuthenticationCode, ttl:number):Promise<boolean>{
        const result = await this.cache.set(key, JSON.stringify(payload), { 'PX':ttl });
        return result === "OK";
    }

    /**
     * Retrieves and deletes a Authorization Code in cache
     * 
     * Inorder Flow:
     * - retrieve and delete the existing authorization code and return it
     */

    async getAndDeleteCachedAuthorizationCode(key:string):Promise<AuthenticationCode | null>{
        const result = await this.cache.getDel(key);
        return result ? JSON.parse(result) : null;
    }

    /**
     * Create a Access Token in cache
     * 
     * Inorder Flow:
     * - save the access token with expiry and return status
     */
    async cacheAccessToken(key:string, payload:Token, ttl:number):Promise<boolean>{
        const result = await this.cache.set(key, JSON.stringify(payload), { 'PX':ttl });
        return result === "OK";
    }

    /**
     * Create a Access Token in Db
     * 
     * Inorder Flow:
     * - save the access token and return status
     */
    async createAccessToken(payload:Token):Promise<boolean>{
        const result = await this.db.collection<Token>("accessTokens").insertOne(payload);
        return result.acknowledged;
    }
    /**
     * Create a Refresh Token in Db
     * 
     * Inorder Flow:
     * - save the refresh token and return status
     */
    async createRefreshToken(payload:Token):Promise<boolean>{
        const result = await this.db.collection<Token>("refreshTokens").insertOne(payload);
        return result.acknowledged;
    }

    /**
     * Retrieve a Access or Refresh Token in Db
     * 
     * Inorder Flow:
     * - retrieve the access or refresh token and return it
     * 
     * @remarks
     * checks isActive is true and expiresAt is greater than current time
     */
    async getRefreshToken(key:string):Promise<Token | null>{
        const result = await this.db.collection<Token>("refreshTokens").findOne({
            tokenString:key,
            isActive:true,
            expiresAt:{$gt:new Date()}
        });
        return result ? result : null;
    }

    /**
     * Deactivate a Refresh Token in Db
     * 
     * Inorder Flow:
     * - update the refresh token's isActive to false and return status
     * 
     * @remarks
     * checks isActive is true before updating
     */
    async deactivateToken(key:string):Promise<boolean>{
        const result = await this.db.collection<Token>("refreshTokens").updateOne({
            tokenString:key,
            isActive:true
        },{
            $set:{isActive:false}
        });
        return result.modifiedCount === 1;
    }
}