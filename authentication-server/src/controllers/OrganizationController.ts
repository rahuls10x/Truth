import type { RequestHandler } from "express";
import type OrganizationService from "../services/OrganizationService.js";
import { errorHandling, strictCheck } from "../utils/ApplicationError.js";
import { CreateClientInput, ForgotPasswordInput, OrgSignupInput } from "../utils/ValidationSchema.js";

export default class OrganizationController {
	private orgService: OrganizationService;
	constructor(orgService: OrganizationService) {
		this.orgService = orgService;
	}

	/**
     * Handles signup request
     * 
     * Inorder Flow:
     * - validate and retrieve data from request body
     * - signup the organization
     * - structure and send a response
     */
	signupRequest: RequestHandler = async (req, res) => {
		try {
			const status = OrgSignupInput.safeParse(req.body);
			const validateData = strictCheck(status.data, 400, status.error?.issues[0]?.message || "Invalid request data");

			await this.orgService.signup({ ...validateData });

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
	 * - validate and retrieve email from request body
	 * - generate and sent reset link
	 * - structure and send a response
	 */
	forgotPassword: RequestHandler = async (req, res) => {
		try {
			const status = ForgotPasswordInput.safeParse(req.body);
			const validatedData = strictCheck(status.data, 400, status.error?.issues[0]?.message || "Invalid request data");

            await this.orgService.forgotPassword(validatedData.email);

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
	 * - validate and retrieve data, orgId from request body
	 * - create and retrieve client
	 * - structure and send response
	 */
	createClient: RequestHandler = async (req, res) => {
		try {
			const status = CreateClientInput.safeParse(req.body);
			const validatedData = strictCheck(status.data, 400, status.error?.issues[0]?.message || "Invalid request data");
			const orgId = strictCheck(req.organization?.id, 500, "Internal Server Error");

			const client = await this.orgService.createClient(orgId, validatedData);

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
