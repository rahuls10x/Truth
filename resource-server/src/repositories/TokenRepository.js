export default class TokenRepository {
    db;
    cache;
    constructor(db, cache) {
        this.db = db;
        this.cache = cache;
    }
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
    async findActiveAccessToken(token) {
        const cachedToken = await this.cache.get(token);
        if (cachedToken)
            return JSON.parse(cachedToken);
        return await this.db.collection("accessTokens").findOne({
            tokenString: token,
            expiresAt: { $gt: new Date() },
            isActive: true,
        });
    }
}
//# sourceMappingURL=TokenRepository.js.map