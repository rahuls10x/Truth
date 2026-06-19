import type { Db } from "mongodb";
import type { createClient } from "redis";
import type { Token } from "../types/dbSchema.js";

export default class TokenRepository {
	private db: Db;
	private cache: ReturnType<typeof createClient>;

	constructor(db: Db, cache: ReturnType<typeof createClient>) {
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
	async findActiveAccessToken(token: string): Promise<Token | null> {
		const cachedToken = await this.cache.get(token);
		if (cachedToken) return JSON.parse(cachedToken) as Token;

		return await this.db.collection<Token>("accessTokens").findOne({
			tokenString: token,
			expiresAt: { $gt: new Date() },
			isActive: true,
		});
	}
}
