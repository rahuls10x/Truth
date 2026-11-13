import type { RequestHandler } from "express";
import type UserService from "../services/UserService.js";
import { errorHandling, strictCheck } from "../utils/ApplicationError.js";
import { ForgotPasswordInput, UpdateProfileInput, UserSignupInput } from "../utils/ValidationSchema.js";

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
	 * - check and retrieve userId from request (Guarenteed to be present).
	 * - retrieve a user profile DTO by userId
	 * - structure and send a response
	 *
	 */
	getProfile: RequestHandler = async (req, res) => {
		try {
			const userId = strictCheck(req.user?.id, 500, "Internal Server Error");

			const userProfileDTO = await this.userService.getProfile(userId);

			res.status(200).json({
				success: true,
				message: "Data has been retrieved successfully",
				data: userProfileDTO,
			});
		} catch (error) {
			errorHandling(error, res);
		}
	};

	/**
	 * Handle update user profile request
	 *
	 * Inorder Flow:
	 * - validate and retrieve data, userId from request
	 * - update user profile by userId and userDetails
	 * - structure and send a response
	 *
	 */
	updateProfile: RequestHandler = async (req, res) => {
		try {
			const status = UpdateProfileInput.safeParse(req.body);
			const validateData = strictCheck(status.data, 400, status.error?.issues[0]?.message || "Invalid request data");
			const userId = strictCheck(req.user?.id, 500, "Internal Server Error");

			await this.userService.updateProfile({userId,...validateData});

			res.status(200).json({
				success: true,
				message: "Data has been updated successfully",
			});
		} catch (err) {
			errorHandling(err, res);
		}
	};
}
