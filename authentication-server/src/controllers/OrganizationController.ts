import type { RequestHandler } from "express";
import type OrganizationService from "../services/OrganizationService.js";
import { errorHandling, strictCheck } from "../utils/ApplicationError.js";

export default class OrganizationController {
	private orgService: OrganizationService;
	constructor(orgService: OrganizationService) {
		this.orgService = orgService;
	}

	/**
     * Handles signup request
     * 
     * Inorder Flow:
     * - retrieve userName, email, domain, organizationName and password from request body
     * - signup the organization
     * - structure and send a response
     */
	signupRequest: RequestHandler = async (req, res) => {
		try {
			const {
				userName,
				email,
				password,
				domain,
				organizationName,
			}: { userName: string; email: string; password: string; domain: string; organizationName: string } = req.body;

			await this.orgService.signup({ userName, email, password, domain, organizationName });

			res.status(200).json({
				success: true,
				message: "Organization has been registered Successfully",
			});
		} catch (error) {
			errorHandling(error, res);
		}
	};

	/**
	 * Handles forgot password request
	 *
	 * Inorder Flow:
	 * - retrieve email from request body
	 * - generate and sent reset link
	 * - structure and send a response
	 */
	forgotPassword: RequestHandler = async (req, res) => {
		try {
			const { email }: { email: string } = req.body;

            await this.orgService.forgotPassword(email);

			res.status(200).json({
				success: true,
				message: "Password reset link has been sent Successfully",
			});
		} catch (error) {
			errorHandling(error, res);
		}
	};

	/**
	 * Handles get clients request
	 * 
	 * Inorder Flow: 
	 * - check and retrieve orgId from request (Guarenteed to be present).
	 * - retrieve clients list by orgId
	 * - structure and send response
	 */
	getClients: RequestHandler = async (req, res) => {
		try {
			const orgId = strictCheck(req.organization?.id, 500, "Internal Server Error");

			const clients = await this.orgService.getClients(orgId);

			res.status(200).json({
				success: true,
				message: "Clients have been retrieved Successfully",
				data: clients,
			});
		} catch (error) {
			errorHandling(error, res);
		}
	};

	/**
	 * Handles create Client request
	 * 
	 * Inorder Flow: 
	 * - check and retrieve orgId, client details from request (Guarenteed to be present).
	 * - create and retrieve client
	 * - structure and send response
	 */
	createClient: RequestHandler = async (req, res) => {
		try {
			const orgId = strictCheck(req.organization?.id, 500, "Internal Server Error");
			const { clientName, redirectUri, scopes, responseType } = req.body;

			const client = await this.orgService.createClient(orgId, { clientName, redirectUri, scopes, responseType });

			res.status(200).json({
				success: true,
				message: "Client has been created Successfully",
				data: client,
			});
		} catch (error) {
			errorHandling(error, res);
		}
	};
}
