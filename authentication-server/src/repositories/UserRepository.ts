import type { Db } from "mongodb";
import type { User } from "../types/dbSchema.js";


export default class UserRepository{
    private db:Db;

    constructor(db:Db){
        this.db = db;
    }

    /**
     * Checks if email exists
     * 
     * Inorder Flow:
     * - Retrieve user details by email
     * - Return status
     * 
     * @remarks
     * only returns true if user exists
     */
    async checkEmailExists(email:string): Promise<boolean>{
        const user = await this.db.collection<User>("users").findOne({email});
        
        return Boolean(user);
    }

    /**
     * Creates a new user using User object
     * 
     * Inorder Flow:
     * - Creates a new user and returns status
     */
    async createUser(user:User): Promise<Boolean> {
        const result = await this.db.collection<User>("users").insertOne(user);
        return result.acknowledged;
    }

    /**
     * Retrieves User object by email
     * 
     * Inorder Flow:
     * - Retrieve user details and return user details
     * 
     * @remarks
     * checks isVerified flag and only returns verified users
     */
    async getUserByEmail(email:string): Promise<User | null> {
        return await this.db.collection<User>("users").findOne({email, isVerified:true});
    }

    /**
     * Retrieves user object by Id
     * 
     * Inorder Flow:
     * - Retrieve user details and return user details
     * 
     * @remarks 
     * checks isVerified flag and only returns verified users
     */
    async getUserById(userId:string): Promise<User | null> {
        return await this.db.collection<User>("users").findOne({ userId:userId, isVerified:true });
    }

    /**
     * Updates user by userId
     * 
     * Inorder Flow:
     * - Update user details by userId and return status of operation
     * 
     * @remarks It will change only the provided fields and can be used to update any field belonging to user.
     */
    async updateUserById(userId:string, updateData:any): Promise<boolean> {
        const status = await this.db.collection<User>("users").updateOne({ userId }, { $set: updateData }); 
        return status.modifiedCount === 1;
    }

}