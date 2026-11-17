import type { RequestHandler } from "express";
import { errorHandling, socketErrorHandling, strictCheck } from "../utils/ApplicationError.js";
import type AuthService from "../services/AuthService.js";
import DeviceDetector from "device-detector-js";
import type { Hardware } from "../types/dbSchema.js";
import { LoginInput, ResetPasswordInput, RevokeSessionInput, VerifyEmailInput } from "../utils/ValidationSchema.js";
import type { AppSocket } from "../types/socketTypes.js";
import type { StandardResponse } from "../types/index.js";
import type { Server } from "socket.io";
import { createSocketRoomId } from "../routes/socket.js";

export default class AuthController {
    private io: Server;
    private authService: AuthService;
    private deviceDetector: DeviceDetector;

	constructor(io:Server, authService: AuthService) {
        this.io = io;
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
     * - validated and retrieve magicToken from request params
     * - verify email
     * - structure and send response
     */
    verifyEmail: RequestHandler = async (req, res) => {
        try {
            const status = VerifyEmailInput.safeParse(req.params);
            const validateData = strictCheck(status.data, 400, status.error?.issues[0]?.message || "Invalid request data");

            const data = await this.authService.verifyEmail(validateData.magicToken);

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
     * - validate and retrive magicToken, password from request params, request body respectively
     * - verify email
     * - structure and send response
     */
    resetPassword: RequestHandler = async (req, res) => {
        try {
            const { magicToken } = req.params;
			const { password } = req.body;
            const status = ResetPasswordInput.safeParse({ password, magicToken });
            const validatedData = strictCheck(status.data, 400, status.error?.issues[0]?.message || "Invalid request data");

            const data = await this.authService.resetPassword(validatedData.magicToken, validatedData.password);

            res.status(200).json({
                success: true,
                message: "Password has been reset Successfully",
                data:data
            });
        } catch (error) {errorHandling(error, res);}
    }

    /**
     * Handles get sessions event
     * 
     * Inorder Flow:
     * - Retrieve sessionId and entityId from socket
     * - Retrieve all active sessions data
     * - Structure and send response
     */
    async getEntitySessions(socket:AppSocket, callback:(response:StandardResponse) => void){
        try {
            const sessionId = strictCheck(socket.data.sessionId, 500, "Internal Server Error");
            const entityId = strictCheck(socket.data.entityId, 500, "Internal Server Error");

            const sessions = await this.authService.getActiveEntitySessions(sessionId, entityId);

            callback({
                success:true,
                message:"Active Sessions has been retrieved successfully",
                data: sessions
            });
        } catch (error) {
            socketErrorHandling(error, callback);
        }
    }

    /**
     * Handles revoke entity session event
     * 
     * Inorder Flow:
     * - Retrieve sessionId, entityId and validate sessionRef from socket
     * - Revoke the entity session
     * - Structure and send response
     * - Update the active sessions of the revokation and disconnect the session if active
     */
    async revokeEntitySession(socket:AppSocket, data:unknown, callback:(response:StandardResponse)=> void){
        try {
            const sessionId = strictCheck(socket.data.sessionId, 500, "Internal Server Error");
            const entityId = strictCheck(socket.data.entityId, 500, "Internal Server Error");
            const status = RevokeSessionInput.safeParse(data);
            const validatedData = strictCheck(status.data, 400, status.error?.issues[0]?.message || "Invalid Request data");
            const roomId = strictCheck(socket.data.roomId, 500, "Internal Server Error");

            const revokedSessionId = await this.authService.revokeEntitySession(sessionId, validatedData.sessionRef, entityId);

            callback({
                success:true,
                message:"Session has been revoked successfully"
            });

            const allActiveSockets = await this.io.in(roomId).fetchSockets();
            for(const iteratedSocket of allActiveSockets){
                if(iteratedSocket.data.sessionId === revokedSessionId) {
                    iteratedSocket.emit("sessionUpdated", {
                        operation:"logoutCurrent"
                    });
                    iteratedSocket.disconnect(true);
                    continue;
                };
                iteratedSocket.emit("sessionUpdated",{
                    operation:"sessionRevoked",
                    data:validatedData
                });
            }

        } catch (error) {
            socketErrorHandling(error, callback);
        }
    }

    /**
     * Handles Revoke all entity sessions event
     * 
     * Inorder Flow:
     * - Retrieve sessionId, entityId, from socket
     * - Revoke all sessions
     * - Structure and send response
     * - Update the active sessions of the revokation and disconnect the session if active
     */
    async revokeAllEntitySessions(socket:AppSocket, callback:(response:StandardResponse) => void){
        try {
            const sessionId = strictCheck(socket.data.sessionId, 500, "Internal Server Error");
            const entityId = strictCheck(socket.data.entityId, 500, "Internal Server Error");
            const roomId = strictCheck(socket.data.roomId, 500, "Internal Server Error");

            await this.authService.revokeAllEntitySessions(sessionId, entityId);

            callback({
                success: true,
                message: "Sessions have been revoked successfully"
            });

            const allActiveSockets = await this.io.in(roomId).fetchSockets();
            for(const iteratedSocket of allActiveSockets){
                if(iteratedSocket.data.sessionId !== sessionId){
                    iteratedSocket.emit("sessionUpdated",{
                        operation:"logoutCurrent",
                    });
                    iteratedSocket.disconnect(true);
                }else{
                    iteratedSocket.emit("sessionUpdated",{
                        operation:"allSessionsRevokedExceptCurrent"
                    });
                }
            }

        } catch (error) {
            socketErrorHandling(error, callback);
        }
    }

    /**
     * Handles user login Request
     * 
     * Inorder Flow:
     * - validate data and retrieve ip, device information from request body, headers
     * - retrive login Payload, sessionPayload, sessionId, entityId from login
     * - set cookie with sessionId 
     * - Create roomId and Update the active sessions of new addition
     * - structure and send response
     */
    userLogin: RequestHandler = async (req, res) => {
        try {
            const status = LoginInput.safeParse(req.body);
            const validatedData = strictCheck(status.data, 400, status.error?.issues[0]?.message || "Invalid request data");
            const ip = req.ip as string;
            const userAgent = req.headers["user-agent"] as string;
            const hardware = this.deviceDetector.parse(userAgent) as Hardware;

            const [loginPayload, sessionPayload, sessionId, entityId] = strictCheck(await this.authService.userLogin({...validatedData, ip, hardware}), 401, "Invalid Credentials");

            res.cookie("authToken", sessionId, {
                httpOnly: true,
                secure: false, // true in prod,
                sameSite: "lax", // strict in prod,
                maxAge: 4320 * 60 * 1000,
            });

            const roomId = createSocketRoomId(entityId);
            this.io.to(roomId).emit("sessionUpdated", {
                operation:"newLogin",
                data:sessionPayload
            });

            res.status(200).json({
                success: true,
                message: "User has been logged Successfully",
                data:loginPayload
            });
        } catch (error) {errorHandling(error, res);}
    }

    /**
     * Handles organization login Request
     * 
     * Inorder Flow:
     * - validate data and retrieve ip, device information from request body, headers
     * - retrive login Payload, sessionPayload, sessionId, entityId from login
     * - set cookie with sessionId 
     * - Create roomId and Update the active sessions of new addition
     * - structure and send response
     */ 
    organizationLogin: RequestHandler = async (req, res) => {
        try {
            const status = LoginInput.safeParse(req.body);
            const validatedData = strictCheck(status.data, 400, status.error?.issues[0]?.message || "Invalid request data");
            const ip = req.ip as string;
            const userAgent = req.headers["user-agent"] as string;
            const hardware = this.deviceDetector.parse(userAgent) as Hardware;

            const [loginPayload, sessionPayload, sessionId, entityId] = strictCheck(await this.authService.organizationLogin({...validatedData, ip, hardware}), 401, "Invalid Credentials");

            res.cookie("authToken", sessionId, {
                httpOnly: true,
                secure: false, // true in prod,
                sameSite: "lax", // strict in prod,
                maxAge: 4320 * 60 * 1000,
            });

            const roomId = createSocketRoomId(entityId);
            this.io.to(roomId).emit("sessionUpdated", {
                operation:"newLogin",
                data:sessionPayload
            });

            res.status(200).json({
                success: true,
                message: "Organization has been logged Successfully",
                data:loginPayload
            });
        } catch (error) {errorHandling(error, res);}
    }

    /**
     * Handles logout Request
     * 
     * Inorder Flow:
     * - retrive current sessionId from request session (Guarenteed to be present)
     * - revoke the current session
     * - clear cookie
     * - Create roomId and Update the active sessions of new deletion
     * - structure and send response
     */
    logout: RequestHandler = async (req, res) => {
        try {
            const sessionId = strictCheck(req.sessionId, 500, "Internal Server Error");
            const entityId = strictCheck(req.user?.id ?? req.organization?.id, 500, "Internal Server Error");

            const revokedSessionRef = await this.authService.logout(sessionId);
            
            res.clearCookie("authToken");

            const roomId = createSocketRoomId(entityId);
            const allActiveSockets = await this.io.in(roomId).fetchSockets();
            for(const iteratedSocket of allActiveSockets){
                if(iteratedSocket.data.sessionId === sessionId) {
                    iteratedSocket.emit("sessionUpdated", {
                        operation:"logoutCurrent"
                    });
                    iteratedSocket.disconnect(true);
                    continue;
                };
                iteratedSocket.emit("sessionUpdated",{
                    operation:"sessionRevoked",
                    data:{sessionRef: revokedSessionRef}
                });
            };
            
            res.status(200).json({
                success: true,
                message: "User has been logged out Successfully",
            });
        } catch (error) {errorHandling(error, res);}
    }
}
