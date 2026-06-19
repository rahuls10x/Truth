import type { RequestHandler } from "express";
import type UserService from "../services/UserService.js";
import { errorHandling, strictCheck } from "../utils/ApplicationError.js";

export default class UserController{
    private userService: UserService;

    constructor(userService: UserService) {
        this.userService = userService;
    }

    /**
     * Handles signup request
     * 
     * Inorder Flow:
     * - retrieve name, email and password from request body
     * - signup the user
     * - structure and send a response
     */
    signupRequest: RequestHandler = async (req, res) => {
        try {
            const { name, email, password }: { name: string; email: string; password: string } = req.body;

            await this.userService.signup({ name, email, password });

            res.status(200).json({
                success: true,
                message: "User has been registered Successfully",
            });
        } catch (error) {errorHandling(error, res);};
    }

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
                data:userProfileDTO
            });
        } catch (error) {
            errorHandling(error, res);
        }
    }

    /**
     * Handle update user profile request
     * 
     * Inorder Flow:
     * - check and retrieve userId from request (Guarenteed to be present).
     * - update user profile by userId and userDetails
     * - structure and send a response
     * 
     */
    updateProfile: RequestHandler = async (req, res) => {
        try {
            const userId = strictCheck(req.user?.id, 500, "Internal Server Error");
            
            await this.userService.updateProfile({
                userId,
                name: req.body.name,
                email: req.body.email,
                age: req.body.age,
                gender: req.body.gender
            });

            res.status(200).json({
                success: true,
                message: "Data has been updated successfully",
            });
        } catch(err){errorHandling(err,res)}
    }
}