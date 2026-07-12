import type { Client, Organization } from "../types/dbSchema.js";
import type OrganizationRepository from "../repositories/OrganizationRepository.js";
import { strictCheck } from "../utils/ApplicationError.js";
import CryptoService from "./CryptoService.js";
import type ClientRepository from "../repositories/ClientRepository.js";
import type { ClientPayload, CreateClientParams} from "../types/index.js";
import type LinkService from "./LinkSevice.js";
import type MailService from "./MailService.js";

export default class OrganizationService {
	private orgRepository: OrganizationRepository;
	private clientRepository: ClientRepository;
	private linkService: LinkService;
	private mailService: MailService;

	constructor(orgRepository: OrganizationRepository, clientRepository: ClientRepository, linkService: LinkService, mailService: MailService) {
		this.orgRepository = orgRepository;
		this.clientRepository = clientRepository;
		this.linkService = linkService;
		this.mailService = mailService;
	}

	/**
	 * Handles Organization signup
	 *
	 * Inorder Flow:
	 * - Check if organization already exists (by email)
	 * - create organization object (password hashing, Id generation also done here)
	 * - create organization and verify organization creation
	 * - create magic token and logs it
	 * - return true (will not reach here if any of the above step causes error)
	 *
	 * @refinement
	 * implement otp veirfication system
	 */
	async signup({
		userName,
		email,
		password,
		domain,
		organizationName,
	}: {
		userName: string;
		email: string;
		password: string;
		domain: string;
		organizationName: string;
	}): Promise<true> {
		strictCheck(!(await this.orgRepository.checkEmailExists(email)), 409, "Organization already exists");

		const orgObject: Organization = {
			orgId: CryptoService.generateOrganizationId(),
			userName,
			organizationName,
			email,
			domain,
			password: await CryptoService.hashPassword(password),
			isVerified: false,
		};

		strictCheck(await this.orgRepository.createOrganization(orgObject), 500, "Internal Server Error");

		const magicToken = await this.linkService.createMagicToken(orgObject.orgId, 'organization', "verify");
		await this.mailService.sendVerificationEmail(email, magicToken);

		return true;
	}

	/**
	 * Creates and send Password reset link
	 * 
	 * Inorder Flow:
	 * - Retrieve and check the organization by email
	 * - create magic token and emails it
	 * - returns true
	 */
	async forgotPassword( email: string ):Promise<true> {
		const organizationObject = strictCheck(await this.orgRepository.getOrganizationByEmail(email), 409, "Organization does not exist");
		
		const magicToken = await this.linkService.createMagicToken(organizationObject.orgId, "organization", "resetPassword");
		await this.mailService.sendPasswordResetEmail(email, magicToken);

		return true;
	}

	/**
	 * Provides clients DTO for an organization
	 *
	 * Inorder Flow:
	 * - fetch all clients belonging to organization by orgId
	 * - model client details for safety
	 * - return clientDTO
	 */
	async getClients(orgId: string): Promise<ClientPayload[]> {
		const clientsList = await this.clientRepository.getClientsByOrgId(orgId);

		const clientDTO: ClientPayload[] = [];
		for (const client of clientsList ?? []) {
			const safeClientDetails = {
				clientId: client.clientId,
				clientName: client.clientName,
				clientSecret: client.clientSecret,
				createdAt: client.createdAt,
				redirectUri: client.redirectUri,
				responseType: client.responseType,
				scopes: client.scopes,
			};
			clientDTO.push(safeClientDetails);
		}

		return clientDTO;
	}

	/**
	 * Creates a Client with given params
	 *
	 * Inorder Flow:
	 * - create client object
	 * - create and verify client creation
	 * - model and return newly created client for safety
	 */
	async createClient(orgId: string, params: CreateClientParams): Promise<ClientPayload> {
		const clientObject: Client = {
			clientId: CryptoService.generateClientId(),
			clientName: params.clientName,
			orgId,
			clientSecret: CryptoService.generateClientSecret(),
			createdAt: new Date(),
			redirectUri: params.redirectUri,
			scopes: params.scopes,
			responseType: params.responseType,
		};

		strictCheck(await this.clientRepository.createClient(clientObject), 500, "Internal Server Error");

		const safeClientDetails: ClientPayload = {
			clientId: clientObject.clientId,
			clientName: clientObject.clientName,
			clientSecret: clientObject.clientSecret,
			createdAt: clientObject.createdAt,
			redirectUri: clientObject.redirectUri,
			responseType: clientObject.responseType,
			scopes: clientObject.scopes,
		};
		return safeClientDetails;
	}
}
