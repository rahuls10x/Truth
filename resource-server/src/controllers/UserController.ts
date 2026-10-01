import type { Request, Response, RequestHandler } from "express-serve-static-core";
import { errorHandling, strictCheck } from "../utils/ApplicationError.js";
import type UserService from "../services/UserService.js";

export default class UserController{
    private userService: UserService

    constructor(userService:UserService){
        this.userService = userService;
    }

    /**
     * Handles resource request
     * 
     * Inorder Flow:
     * - Get user id and scopes from request
     * - Get user resource payload
     * - Return user resource response
     */
    resource: RequestHandler = async (req: Request, res :Response) => {
        try{
            const params = strictCheck(req.user, 500, "Internal Server Error");

            const result = await this.userService.getResource(params);

            res.status(200).json({
                success: true,
                message: "User resource has been fetched Successfully",
                data: result
            });

        }catch(error){errorHandling(error,res);};
    }
}