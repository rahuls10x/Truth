import type { RequestHandler } from "express";
import type TokenRepository from "../repositories/TokenRepository.js";
export default class TokenAuthMiddleware {
    private tokenRepository;
    constructor(tokenRepository: TokenRepository);
    /**
     * Middleware to validate access token and inject it into request
     *
     * Inorder flow:
     *
     * 1. Extracts the access token from the Authorization header
     * 2. Checks if the access token is present and in valid format
     * 3. Checks if the access token is active and not expired yet
     * 4. Injects the access token into the request
     * 5. Calls the next middleware
     *
     * @param {Request} req Express request object.
     * @param {Response} res Express response object.
     * @param {NextFunction} next Express next middleware function.
     *
     * @remarks
     * On success, `req.user` will contain:
     * - id
     * - scopes
     */
    verifyAccessToken: RequestHandler;
}
//# sourceMappingURL=TokenAuthMiddleware.d.ts.map