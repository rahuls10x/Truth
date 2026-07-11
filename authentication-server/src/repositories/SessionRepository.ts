import { ObjectId, type Db } from "mongodb";
import type { Session } from "../types/dbSchema.js";

export default class SessionRepository{
    private db:Db;

    constructor(db:Db) {
        this.db = db;
    }

    /**
     * Creates a new session
     * 
     * Inorder Flow:
     * - Creates a new session from session object and returns status
     */
    async createSession(sessionObject:Session): Promise<boolean> {
        const result = await this.db.collection<Session>("sessions").insertOne(sessionObject);
        return result.acknowledged;
    }

    /**
     * Find an active session
     * 
     * Inorder Flow:
     * - Retrieves and returns the session
     * 
     * @remarks
     * checks if session is not revoked and not expired
     */
    async findActiveSessionById(sessionId: string): Promise<Session | null> {
        const result = await this.db.collection<Session>("sessions").findOne({ 
            sessionId,
            isRevoked: false,
            expiresAt: {$gt: new Date()},
        });
        return result;
    }

    /**
     * Find an active user session 
     * 
     * Inorder Flow:
     * - Retrieves and returns the  user session
     * 
     * @remarks
     * checks if session is not revoked and not expired
     */
    async findActiveUserSessionById(sessionId: string): Promise<Session | null> {
        const result = await this.db.collection<Session>("sessions").findOne({ 
            sessionId,
            type: "user",
            isRevoked: false,
            expiresAt: {$gt: new Date()},
        });
        return result;
    }
    /**
     * Find an active organization session 
     * 
     * Inorder Flow:
     * - Retrieves and returns the organization session
     * 
     * @remarks
     * checks if session is not revoked and not expired
     */
    async findActiveOrganizationSessionById(sessionId: string): Promise<Session | null> {
        const result = await this.db.collection<Session>("sessions").findOne({ 
            sessionId,
            type: 'organization',
            isRevoked: false,
            expiresAt: {$gt: new Date()},
        });
        return result;
    }

    /**
     * Revoke a session by sessionId 
     * 
     * Inorder Flow:
     * - Revokes the session
     * 
     * @remarks
     * does not check if session is already revoked (negligible security risk)
     */
    async revokeSessionById(sessionId: string):Promise <boolean>{
        const result = await this.db.collection<Session>("sessions").updateOne({ 
            sessionId,
        }, {
            $set: {
                isRevoked: true,
            }
        });
        return result.modifiedCount === 1;
    }

    /**
     * Retrieves All active sessions by entityId
     * 
     * Inorder Flow: 
     * - Retrieves and returns all active sessions
     * 
     * @remarks
     * check if session is not revoked and not expired
     */
    async findAllActiveSessionsByEntityId(entityId:string): Promise <Session[]>{
        const result = await this.db.collection<Session>("sessions").find({
            entityId,
            isRevoked:false,
            expiresAt:{ $gt: new Date()}
        }).toArray();
        return result;
    }

    /**
     * Revoke a session by MaskedId(_id) 
     * 
     * Inorder Flow:
     * - Revokes the session
     * 
     * @remarks
     * does not check if session is already revoked (negligible security risk)
     */
    async revokeSessionByMaskedId(_id: string):Promise <boolean>{
        const result = await this.db.collection<Session>("sessions").updateOne({ 
            _id: new ObjectId(_id),
        }, {
            $set: {
                isRevoked: true,
            }
        });
        return result.modifiedCount === 1;
    }

    /**
     * Revoke all sessions except current session
     * 
     * Inorder Flow:
     * - Revokes the all sessions
     * 
     * @remarks
     * does not check if session is already revoked (negligible security risk) and only checks acknowledgement
     */
    async revokeAllSessionsExceptCurrent(currentSessionId: string, entityId: string):Promise <boolean>{
        const result = await this.db.collection<Session>("sessions").updateMany({ 
            entityId,
            sessionId: {$ne: currentSessionId},
        }, {
            $set: {
                isRevoked: true,
            }
        });
        return result.acknowledged;
    }
}