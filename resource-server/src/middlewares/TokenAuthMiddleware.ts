import type { Request, Response, NextFunction, RequestHandler } from "express";
import type TokenRepository from "../repositories/TokenRepository.js";
import ApplicationError, { errorHandling, strictCheck } from "../utils/ApplicationError.js";

export default class TokenAuthMiddleware{
    private tokenRepository: TokenRepository

    constructor(tokenRepository:TokenRepository) {
        this.tokenRepository = tokenRepository;
    }

    /**
     * Middleware to validate access token and inject it into request
     * 
     * Inorder flow:
     * 
     * - Extracts the access token from the Authorization header
     * - Checks if the access token is present and in valid format
     * - Checks if the access token is active and not expired yet
     * - Injects the access token into the request
     * - Calls the next middleware
     * 
     * @remarks
     * On success, `req.user` will contain:
     * - id
     * - scopes
     */
    verifyAccessToken : RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
        try{
            const authHeader = req.headers.authorization;

            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                throw new ApplicationError('Malformed access token', 401);
            }
            const tokenString = strictCheck(authHeader.split(' ')[1], 401, 'Malformed access token');
            strictCheck(tokenString.startsWith('at_'), 401, 'Invalid access token');

            const tokenRecord = strictCheck(await this.tokenRepository.findActiveAccessToken(tokenString), 401, 'Access token is invalid or expired');

            req.user = { 
                id:tokenRecord.userId,
                scopes:tokenRecord.scopes
            };

            next();
        }catch(error){errorHandling(error,res);};
    }
}