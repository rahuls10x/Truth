import type { Db } from "mongodb";
import type { createClient } from "redis";
import type { Token } from "../types/dbSchema.js";
export default class TokenRepository {
    private db;
    private cache;
    constructor(db: Db, cache: ReturnType<typeof createClient>);
    /**
     * Retrieve an Active access Token
     *
     * Inorder Flow:
     * - Retrieve from cache and if found return token
     * - Retrieve from DB and return
     *
     * @remarks When it is returned from database it is also checked if its active
     *
     * @param {string} token - access token
     * @returns {Token | null}
     */
    findActiveAccessToken(token: string): Promise<Token | null>;
}
//# sourceMappingURL=TokenRepository.d.ts.map