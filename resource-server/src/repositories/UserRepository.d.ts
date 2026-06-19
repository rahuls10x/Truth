import type { Db } from "mongodb";
import type { User } from "../types/dbSchema.js";
export default class UserRepository {
    private db;
    constructor(db: Db);
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
    getUserById(userId: string): Promise<User | null>;
}
//# sourceMappingURL=UserRepository.d.ts.map