import type { RequestHandler } from "express";
import { errorHandling, strictCheck } from "../utils/ApplicationError.js";
import type AuthService from "../services/AuthService.js";
import DeviceDetector from "device-detector-js";
import type { Hardware } from "../types/dbSchema.js";

export default class AuthController {
    private authService: AuthService;
    private deviceDetector: DeviceDetector;

	constructor(authService: AuthService) {
        this.authService = authService
        this.deviceDetector = new DeviceDetector();
    }

    /**
     * Handles whoAmI Request
     * 
     * Inorder Flow:
     * - retrive entityId from request user or organization
     * - retrive and verify identityPayload DTO from entityId
     * - structure and send response
     */
    whoAmI: RequestHandler = async (req, res) => {
        try {
            const entityId = strictCheck(req.user?.id ?? req.organization?.id, 500, "Internal Server Error");

            const identityPayload = strictCheck(await this.authService.whoAmI(entityId), 500, "Internal Server Error");
            
            res.status(200).json({
                success: true,
                message: `${entityId.startsWith("user_") ? "User" : "Organization"} has been logged Successfully`,
                data: identityPayload
            })
        } catch (error) {errorHandling(error, res);}
    }

    /**
     * Handles verify email Request
     * 
     * Inorder Flow:
     * - retrive magicToken from request params
     * - verify email
     * - structure and send response
     */
    verifyEmail: RequestHandler = async (req, res) => {
        try {
            const magicToken = strictCheck(req.params['magicToken'], 500, "Internal Server Error");

            const data = await this.authService.verifyEmail(magicToken as string);

            res.status(200).json({
                success: true,
                message: "Email has been verified Successfully",
                data:data
            });
        } catch (error) {errorHandling(error, res);}
    }

    /**
     * Handles reset password Request
     * 
     * Inorder Flow:
     * - retrive magicToken from request params
     * - verify email
     * - structure and send response
     */
    resetPassword: RequestHandler = async (req, res) => {
        try {
            const magicToken = strictCheck(req.params['magicToken'], 500, "Internal Server Error");
            const { password } = req.body;

            const data = await this.authService.resetPassword(magicToken as string, password);

            res.status(200).json({
                success: true,
                message: "Password has been reset Successfully",
                data:data
            });
        } catch (error) {errorHandling(error, res);}
    }

    /**
     * Handles get session Request
     * 
     * Inorder Flow: 
     * - Retrieve sessionId and Entity from request
     * - Retrieve session data
     * - structure and send response
     */
    getSessions: RequestHandler = async (req, res) => {
        try {
            const sessionId = strictCheck(req.sessionId, 500, "Internal Server Error");
            const entity = strictCheck(req.user ?? req.organization, 500, "Internal Server Error");

            const sessionData = await this.authService.getSessions(sessionId, entity);

            res.status(200).json({
                success: true,
                message: "Sessions have been retrieved successfully",
                data:sessionData ?? []
            });
        } catch (error) {errorHandling(error, res);}
    }

    /**
     * Handles revoke session Request
     * 
     * Inorder Flow: 
     * - Retrieve maskedId from request body
     * - Revoke session by maskedId
     * - structure and send response
     */
    revokeSession: RequestHandler = async (req, res) => {
        try {
            const { _id } = req.body;

            await this.authService.revokeSession(_id);

            res.status(200).json({
                success: true,
                message: "Session has been revoked successfully"
            });
        } catch (error) {errorHandling(error, res);}
    }

    /**
     * Handles revoke all sessions Request
     * 
     * Inorder Flow: 
     * - Retrieve sessionId, entity from request
     * - Revoke all sessions
     * - structure and send response
     */
    revokeAllSessions: RequestHandler = async (req, res) => {
        try {
            const sessionId = strictCheck(req.sessionId, 500, "Internal Server Error");
            const entity = strictCheck(req.user ?? req.organization, 500, "Internal Server Error");

            await this.authService.revokeAllSessions(sessionId, entity.id);

            res.status(200).json({
                success: true,
                message: "Sessions have been revoked successfully"
            });
        } catch (error) {errorHandling(error, res);}
    }

    /**
     * Handles user login Request
     * 
     * Inorder Flow:
     * - retrive email, password, ip, device information from request body, ip and headers
     * - retrive login Payload from login details
     * - set cookie with sessionId 
     * - structure and send response
     */
    userLogin: RequestHandler = async (req, res) => {
        try {
            const { email, password }: {email:string, password:string } = req.body;
            const ip = req.ip as string;
            const userAgent = req.headers["user-agent"] as string;
            const hardware = this.deviceDetector.parse(userAgent) as Hardware;

            const loginPayload = strictCheck(await this.authService.userLogin({email, password, ip, hardware}), 401, "Invalid Credentials");

            res.cookie("authToken", loginPayload.sessionId, {
                httpOnly: true,
                secure: false, // true in prod,
                sameSite: "lax", // strict in prod,
                maxAge: 4320 * 60 * 1000,
            });

            res.status(200).json({
                success: true,
                message: "User has been logged Successfully",
                data:{
                    name:loginPayload.name,
                    email:loginPayload.email
                }
            })
        } catch (error) {errorHandling(error, res);}
    }

    /**
     * Handles organization login Request
     * 
     * Inorder Flow:
     * - retrive email, password, ip, device information from request body, ip and headers
     * - retrive login Payload from login details
     * - set cookie with sessionId 
     * - structure and send response
     */
    organizationLogin: RequestHandler = async (req, res) => {
        try {
            const { email, password }: {email:string, password:string } = req.body;
            const ip = req.ip as string;
            const userAgent = req.headers["user-agent"] as string;
            const hardware = this.deviceDetector.parse(userAgent) as Hardware;

            const loginPayload = strictCheck(await this.authService.organizationLogin({email, password, ip, hardware}), 401, "Invalid Credentials");

            res.cookie("authToken", loginPayload.sessionId, {
                httpOnly: true,
                secure: false, // true in prod,
                sameSite: "lax", // strict in prod,
                maxAge: 4320 * 60 * 1000,
            });

            res.status(200).json({
                success: true,
                message: "Organization has been logged Successfully",
                data:{
                    name:loginPayload.name,
                    email:loginPayload.email
                }
            })
        } catch (error) {errorHandling(error, res);}
    }

    /**
     * Handles logout Request
     * 
     * Inorder Flow:
     * - retrive current sessionId from request session (Guarenteed to be present)
     * - revoke the current session
     * - set cookie with sessionId 
     * - structure and send response
     */
    logout: RequestHandler = async (req, res) => {
        try {

            const sessionId = strictCheck(req.sessionId, 500, "Internal Server Error");

            await this.authService.logout(sessionId);
            
            res.clearCookie("authToken");
            
            res.status(200).json({
                success: true,
                message: "User has been logged out Successfully",
            })
        } catch (error) {errorHandling(error, res);}
    }
}
