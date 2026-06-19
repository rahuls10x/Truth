import type { RequestHandler } from "express-serve-static-core";
import type UserService from "../services/UserService.js";
export default class UserController {
    private userService;
    constructor(userService: UserService);
    /**
     * Handles resource request
     *
     * Inorder Flow:
     * - Get user id and scopes from request ( set by TokenAuthMiddleware )
     * - Get user resource {UserPayload} for user service
     * - Return user resource response
     *
     * @param {Request} req
     * @param {Response} res
     */
    resource: RequestHandler;
}
//# sourceMappingURL=UserController.d.ts.map