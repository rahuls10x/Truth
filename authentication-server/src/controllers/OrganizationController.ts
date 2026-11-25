import type { RequestHandler } from "express";
import type OrganizationService from "../services/OrganizationService.js";
import { errorHandling, socketErrorHandling, strictCheck } from "../utils/ApplicationError.js";
import { CreateClientInput, ForgotPasswordInput, OrgSignupInput } from "../utils/ValidationSchema.js";
import type { AppSocket } from "../types/socketTypes.js";
import type { StandardResponse } from "../types/index.js";

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
	 * Handles get clients event
	 * 
	 * Inorder Flow: 
	 * - Check entityType and retrieve orgId from socket
	 * - Retrieve clients list by orgId
	 * - Structure and send response
	 */
	async getClients(socket: AppSocket, callback: (response: StandardResponse) => void): Promise<void> {
		try {
			strictCheck(socket.data.entityType === "organization", 400, "Unauthorized request");
			const orgId = strictCheck(socket.data.entityId, 500, "Internal Server Error");

			const clients = await this.orgService.getClients(orgId);

			callback({
				success: true,
				message: "Clients have been retrieved Successfully",
				data: clients,
			});
		} catch (error) {
			socketErrorHandling(error, callback);
		}
	}

	/**
	 * Handles create client event
	 * 
	 * Inorder Flow: 
	 * - Check entityType and validate input data from socket
	 * - Retrieve orgId and roomId from socket
	 * - Create client by orgId and validatedData
	 * - Structure and send response in callback
	 * - Broadcast clientAdded update to room
	 */
	async createClient(socket: AppSocket, data: unknown, callback: (response: StandardResponse) => void): Promise<void> {
		try {
			strictCheck(socket.data.entityType === "organization", 400, "Unauthorized request");
			const status = CreateClientInput.safeParse(data);
			const validatedData = strictCheck(status.data, 400, status.error?.issues[0]?.message || "Invalid request data");

			const orgId = strictCheck(socket.data.entityId, 500, "Internal Server Error");
			const roomId = strictCheck(socket.data.roomId, 500, "Internal Server Error");

			const client = await this.orgService.createClient(orgId, validatedData);

			callback({
				success: true,
				message: "Client has been created Successfully",
				data: client,
			});

			socket.to(roomId).emit("clientUpdated", {
				operation: "clientAdded",
				data: client,
			});
		} catch (error) {
			socketErrorHandling(error, callback);
		}
	}
}
