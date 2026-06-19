import type { Db } from "mongodb";
import type { UserConsent } from "../types/dbSchema.js";

export default class ConsentRepository{
    private db: Db
    
    constructor(db: Db){
        this.db = db;
    }

    /**
     * Get consent waiver by userId and clientId
     * 
     * Inorder Flow:
     * - Retrieves and returns the waiver
     * 
     * @remarks
     * checks if consent is true, isRevoked is false
     */
    async getWaiverByUserIdAndClientId(userId: string, clientId: string): Promise< UserConsent | null>{
        return await this.db.collection<UserConsent>("userConsents").findOne({
            userId,
            clientId,
            consent:true,
            isRevoked:false});
    }

    /**
     *  Creates a new user consent by userConsent object
     * 
     * Inorder Flow:
     * - Creates a new user consent and returns status
     */
    async createUserConsent(userConsent:UserConsent): Promise<boolean> {
        const status = await this.db.collection<UserConsent>("userConsents").insertOne(userConsent);
        return status.acknowledged;
    }
}