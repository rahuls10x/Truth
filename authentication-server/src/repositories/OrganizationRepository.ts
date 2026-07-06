import type { Db } from "mongodb";
import type { Organization } from "../types/dbSchema.js";

export default class OrganizationRepository {
	private db: Db;

	constructor(db: Db) {
		this.db = db;
	}

	/**
	 * Checks if email exists
	 *
	 * Inorder Flow:
	 * - Retrieve organization details by email
	 * - Return status
	 *
	 * @remarks
	 * only returns true if organization exists
	 */
	async checkEmailExists(email: string): Promise<boolean> {
		const organization = await this.db.collection<Organization>("organizations").findOne({ email });

		return Boolean(organization);
	}

	/**
	 * Creates a new organization using Organization object
	 *
	 * Inorder Flow:
	 * - Creates a new organization and returns status
	 */
	async createOrganization(org: Organization): Promise<Boolean> {
		const result = await this.db.collection<Organization>("organizations").insertOne(org);
		return result.acknowledged;
	}

	/**
	 * Retrieves Organization object by email
	 *
	 * Inorder Flow:
	 * - Retrieve organization details and return organization details
	 *
	 * @remarks
	 * checks isVerified flag and only returns verified organizations
	 */
	async getOrganizationByEmail(email: string): Promise<Organization | null> {
		return await this.db.collection<Organization>("organizations").findOne({ email, isVerified: true });
	}

	/**
	 * Retrieves organization object by orgId
	 *
	 * Inorder Flow:
	 * - Retrieve organization details and return organization details
	 *
	 * @remarks
	 * checks isVerified flag and only returns verified organizations
	 */
	async getOrganizationById(orgId: string): Promise<Organization | null> {
		return await this.db.collection<Organization>("organizations").findOne({ orgId, isVerified: true });
	}

	/**
	 * Updates Organization by orgId
	 *
	 * Inorder Flow:
	 * - Update organization details by orgId and return status of operation
	 *
	 * @remarks It will change only the provided fields and can be used to update any field belonging to organization.
	 */
	async updateOrganizationById(orgId: string, updateData: any): Promise<boolean> {
		const status = await this.db.collection<Organization>("organizations").updateOne({ orgId }, { $set: updateData });
		return status.modifiedCount === 1;
	}
}
