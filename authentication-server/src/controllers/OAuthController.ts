import type { RequestHandler, Response } from "express";
import { errorHandling, strictCheck } from "../utils/ApplicationError.js";
import type OAuthService from "../services/OAuthService.js";
import { AuthorizeInput, ConsentInput, RefreshTokenInput, TokenizeInput } from "../utils/ValidationSchema.js";
export default class OAuthController {
	private oAuthService: OAuthService;
	constructor(oAuthService: OAuthService) {
		this.oAuthService = oAuthService;
	}

	/**
	 * Handles the consent Request
	 * 
	 * Inorder Flow:
	 * - validate and retrieve data and seperate it from request
	 * - create user consent
	 * - structure and send response
	 */
	consent: RequestHandler = async (req, res: Response) => {
		try{
			const userId = strictCheck(req.user?.id, 500, "Internal Server Error");
			const status = ConsentInput.safeParse(req.body);
			const validatedData = strictCheck(status.data, 400, status.error?.issues[0]?.message || "Invalid request data");
			const { consent, client_id:clientId, scopes } = validatedData;

			await this.oAuthService.consent({ userId, consent, clientId, scopes });

			res.status(201).json({
				success: true,
				message: "Consent has been noted Successfully"
			});
		}catch(error){
			errorHandling(error, res);
		}
	}

	/**
	 * Handles the authorization request
	 * 
	 * Inorder Flow:
	 * - validate and retrive data, seperate it from request, userId 
	 * - retrive redirectUrl
	 * - redirect the user to retrieved redirect url
	 */
	authorize: RequestHandler = async (req, res: Response) => {
		try {
			const status = AuthorizeInput.safeParse(req.query);
			const validatedData = strictCheck(status.data, 400, status.error?.issues[0]?.message || "Invalid request data");
			const {client_id:clientId, redirect_uri:redirectUri, response_type:responseType, state, challenge_method:challengeMethod, scopes:scope, code_challenge:codeChallenge } = validatedData;
			const userId = strictCheck(req.user?.id, 500, "Internal Server Error");

			const redirectUrl = await this.oAuthService.authorize({ clientId, redirectUri, responseType, state, challengeMethod, scope, codeChallenge, userId });

			res.status(302).redirect(redirectUrl);
		} catch (error) {
			errorHandling(error, res);
		}
	};

	/**
	 * Handles the tokenization request
	 * 
	 * Inorder Flow:
	 * - validate and retrieve data and seperate it from request
	 * - retrive tokenPayload DTO
	 * - structure and send response
	 */
	tokenize: RequestHandler = async (req, res: Response) => {
		try {
			const status = TokenizeInput.safeParse(req.body);
			const validateData = strictCheck(status.data, 400, status.error?.issues[0]?.message || "Invalid request data");
			const { client_id:clientId, client_secret:clientSecret, code:code, code_verifier:codeVerifier } = validateData;

			const result = await this.oAuthService.tokenize({ clientId, clientSecret, code, codeVerifier });

			res.status(200).json({
                success: true,
				message: "Token has been issued Successfully",
				data: result
            });
		} catch (error) {
			errorHandling(error, res);
		}
	};

	/**
	 * Handles the Refresh token request
	 * 
	 * Inorder Flow:
	 * - validate and retrieve data and seperate it from request
	 * - retrive tokenPayload DTO
	 * - structure and send response
	 */
	refreshToken: RequestHandler = async (req, res: Response) => {
        try{
            const status = RefreshTokenInput.safeParse(req.body);
			const validatedData = strictCheck(status.data, 400, status.error?.issues[0]?.message || "Invalid request data");
			const { client_id:clientId, client_secret:clientSecret , refresh_token:refreshToken } = validatedData;
			
            const result = await this.oAuthService.refreshToken({clientId, clientSecret, refreshToken});

			res.status(200).json({
				success: true,
				message: "Token has been refreshed Successfully",
				data: result
			});

        }catch(error){errorHandling(error,res);};
    }
}
