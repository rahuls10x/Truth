import type { Db } from "mongodb";
import type { Client } from "../types/dbSchema.js";

export default class ClientRepository {
	private db: Db;

	constructor(db: Db) {
		this.db = db;
	}

	/**
	 *  Find client by clientId
	 * 
	 * Inorder Flow:
	 * - Retrieves and returns the client
	 */
	async findByClientId(clientId: string): Promise<Client | null> {
		return await this.db.collection<Client>("clients").findOne({ clientId });
	}

	/**
	 * Retrieve clients by orgId
	 * 
	 * Inorder Flow:
	 * - Retrieves and returns the clients array
	 */
	async getClientsByOrgId(orgId: string): Promise<Client[] | null> {
		return await this.db.collection<Client>("clients").find({ orgId }).toArray();
	}

	/**
	 * Creates a new client
	 * 
	 * Inorder Flow:
	 * - Creates a new client and returns status
	 */
	async createClient(client: Client): Promise<boolean> {
		const result = await this.db.collection<Client>("clients").insertOne(client);
		return result.acknowledged;
	}
}
