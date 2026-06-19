import type { Db } from "mongodb";
import type { User } from "../types/dbSchema.js";

export default class UserRepository{
    private db: Db
    
    constructor(db: Db){
        this.db = db;
    }

    /**
     *  Fetch user details by id
     * 
     * Inorder Flow:
     * - Fetch user details by id and return it
     * 
     * @remarks
     * - Only verified user is fetched
     * 
     * @param {string} userId 
     * @returns {User | null}
     */
    async getUserById(userId: string): Promise<User | null> {
        return await this.db.collection<User>("users").findOne({
            userId,
            isVerified:true
        });
    }
}