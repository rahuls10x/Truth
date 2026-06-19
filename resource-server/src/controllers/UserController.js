import { errorHandling, strictCheck } from "../utils/ApplicationError.js";
export default class UserController {
    userService;
    constructor(userService) {
        this.userService = userService;
    }
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
    resource = async (req, res) => {
        try {
            const params = strictCheck(req.user, 500, "Internal Server Error");
            const result = await this.userService.getResource(params);
            res.status(200).json(result);
        }
        catch (error) {
            errorHandling(error, res);
        }
        ;
    };
}
//# sourceMappingURL=UserController.js.map