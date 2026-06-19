import crypto from "crypto";
import argon2 from "argon2";

export default class CryptoService {
    constructor() {}

    /**
     * Generate a random Authorization Code
     * 
     * Inorder Flow:
     * - generate and return Authorization Code ( 32 chars + prefix)
     */
    static generateCode() {
        return "auth_" + crypto.randomBytes(16).toString('hex');
    }

    /**
     * Verify a Code challenge
     * 
     * Inorder Flow:
     * - verify the code challenge
     * 
     * @refinement
     * Add a different code challenge method
     */
    static verifyCodeChallenge(_challengeMethod: "S256" , codeChallenge: string, codeVerifier: string) {
        const hashedCodeVerifier = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
        return hashedCodeVerifier === codeChallenge;
    }

    /**
     * Generate an access token 
     * 
     * Inorder Flow:
     * - generate and return Access Token (64 chars + prefix)
     */
    static generateAccessToken() {
        return "at_" + crypto.randomBytes(32).toString('hex');
    }

    /**
     * Generate a refresh token
     * 
     * Inorder Flow:
     * - generate and return Refresh Token (96 chars + prefix)
     */
    static generateRefreshToken() {
        return "rt_" + crypto.randomBytes(48).toString('hex');
    }
    
    /**
     * Generate a random userId
     * 
     * Inorder Flow:
     * - generate and return UserId (32 chars  + prefix)
     */
    static generateUserId(){
        return "user_" + crypto.randomBytes(16).toString('hex');
    }

    /**
     * Generate a random OrganizationId
     * 
     * Inorder Flow:
     * - generate and return OrgId (32 chars  + prefix)
     */
    static generateOrganizationId(){
        return "org_" + crypto.randomBytes(16).toString('hex');
    }
    /**
     * Generate a random ClientId
     * 
     * Inorder Flow: 
     * - generate and return OrgId (32 chars  + prefix)
     */
    static generateClientId(){
        return "client_" + crypto.randomBytes(16).toString('hex');
    }
    /**
     * Generate a random ClientSecret
     * 
     * Inorder Flow: 
     * - generate and return OrgId (32 chars  + prefix)
     */
    static generateClientSecret(){
        return "secret_" + crypto.randomBytes(16).toString('hex');
    }

    /**
     * Generate a hashed password
     * 
     * Inorder Flow:
     * - generate and return hashed password
     */
    static async hashPassword(password: string):Promise<string>{
        const hashedPassword = await argon2.hash(password);
        return hashedPassword;
    }

    /**
     * Verifies the hashed password against given password
     * 
     * Inorder Flow:
     * - verify hashed password
     */
    static async verifyhashedPassword(password: string, hashedPassword:string):Promise<boolean>{
        const check = await argon2.verify(hashedPassword, password);
        return check;
    }


    /**
     * Generate a random SessionId
     * 
     * Inorder Flow: 
     * - generate and return SessionId (64 chars + prefix)
     */
    static generateSessionId(){
        return "session_" + crypto.randomBytes(32).toString('hex');
    }
}