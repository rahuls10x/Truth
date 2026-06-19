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