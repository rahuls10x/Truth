import type { RequestHandler } from "express";
import type UserService from "../services/UserService.js";
import { errorHandling, socketErrorHandling, strictCheck } from "../utils/ApplicationError.js";
import { ForgotPasswordInput, UpdateUserProfileInput, UserSignupInput } from "../utils/ValidationSchema.js";
import type { AppSocket } from "../types/socketTypes.js";
import type { StandardResponse } from "../types/index.js";

export default class UserController {
	private userService: UserService;

	constructor(userService: UserService) {
		this.userService = userService;
	}

	/**
	 * Handles signup request
	 *
	 * Inorder Flow:
	 * - validate data from request body
	 * - signup the user
	 * - structure and send a response
	 */
	signupRequest: RequestHandler = async (req, res) => {
		try {
			const status = UserSignupInput.safeParse(req.body);
			const validatedData = strictCheck(status.data, 400, status.error?.issues[0]?.message || "Invalid request data");

			await this.userService.signup(validatedData);

			res.status(200).json({
				success: true,
				message: "User has been registered Successfully",
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

            await this.userService.forgotPassword(validatedData.email);

			res.status(200).json({
				success: true,
				message: "Password reset link has been sent Successfully",
			});
		} catch (error) {
			errorHandling(error, res);
		}
	};

	/**
	 * Handle get user profile request
	 *
	 * Inorder Flow:
	 * - check entityType and retrieve userId from socket.
	 * - retrieve a user profile by userId
	 * - structure and send a response
	 *
	 */
	async viewUserProfile(socket:AppSocket, callback: (response: StandardResponse) => void): Promise<void>{
		try {
			strictCheck(socket.data.entityType === "user", 400, "Unauthorized request");
			const userId = strictCheck(socket.data.entityId, 500, "Internal Server Error")

			const userProfile = await this.userService.getProfile(userId);

			callback({
				success:true,
				message:"Profile has been retrieved successfully",
				data: userProfile
			});
		} catch (error) {
			socketErrorHandling(error,callback);
		}
	}

	/**
	 * Handle update user profile event
	 *
	 * Inorder Flow:
	 * - validate entityType,data and retrieve data, userId from socket
	 * - update user profile by userId and userDetails
	 * - structure and send a response
	 *
	 */
	async updateUserProfile(socket:AppSocket, data: unknown, callback:(response:StandardResponse) => void):Promise<void> {
		try {
			strictCheck(socket.data.entityType === "user", 400, "Unauthorized request");
			const status = UpdateUserProfileInput.safeParse(data);
			const validatedData = strictCheck(status.data, 400, status.error?.issues[0]?.message || "Invalid request data");
			const userId = strictCheck(socket.data.entityId, 500, "Internal Server Error");
			const roomId = strictCheck(socket.data.roomId, 500, "Internal Server Error");

			await this.userService.updateUserProfile(userId, validatedData);

			callback({
				success: true,
				message: "Data has been updated successfully",
			});

			socket.to(roomId).emit('userProfileUpdated', {
				operation:'userProfileUpdated',
				data:validatedData
			});
		} catch (err) {
			socketErrorHandling(err, callback);
		}
	}
}
