export default class UserRepository {
    db;
    constructor(db) {
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
    async getUserById(userId) {
        return await this.db.collection("users").findOne({
            userId,
            isVerified: true
        });
    }
}
//# sourceMappingURL=UserRepository.js.map