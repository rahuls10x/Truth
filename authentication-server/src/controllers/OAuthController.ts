import type { RequestHandler, Response } from "express";
import { errorHandling, strictCheck } from "../utils/ApplicationError.js";
import type OAuthService from "../services/OAuthService.js";
export default class OAuthController {
	private oAuthService: OAuthService;
	constructor(oAuthService: OAuthService) {
		this.oAuthService = oAuthService;
	}

	/**
	 * Handles the consent Request
	 * 
	 * Inorder Flow:
	 * - retrive and check userId, consent, client_id, scopes (userId is guarenteed to be present)
	 * - create user consent
	 * - structure and send response
	 */
	consent: RequestHandler = async (req, res: Response) => {
		try{
			const userId = strictCheck(req.user?.id, 500, "Internal Server Error");
			const { consent, client_id, scopes } = req.body

			await this.oAuthService.consent({ userId, consent, clientId:client_id, scopes });

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
	 * - retrive and check authorizationRequest, userId (both are guarenteed to be present)
	 * - retrive redirectUrl
	 * - redirect the user to retrieved redirect url
	 */
	authorize: RequestHandler = async (req, res: Response) => {
		try {
			const authorizationQuery = strictCheck(req.authorizationRequest, 500, "Internal Server Error");
			const userId = strictCheck(req.user?.id, 500, "Internal Server Error");

			const redirectUrl = await this.oAuthService.authorize({ ...authorizationQuery, userId });

			res.status(302).redirect(redirectUrl);
			// res.status(200).json({ redirectUrl });
		} catch (error) {
			errorHandling(error, res);
		}
	};

	/**
	 * Handles the tokenization request
	 * 
	 * Inorder Flow:
	 * - retrive and check tokenizationRequest (guarenteed to be present)
	 * - retrive tokenPayload DTO
	 * - structure and send response
	 */
	tokenize: RequestHandler = async (req, res: Response) => {
		try {
			const tokenizationBody = strictCheck(req.tokenizationRequest, 500, "Internal Server Error");

			const result = await this.oAuthService.tokenize(tokenizationBody);

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
	 * - retrive and check refreshTokenRequest (guarenteed to be present)
	 * - retrive tokenPayload DTO
	 * - structure and send response
	 */
	refreshToken: RequestHandler = async (req, res: Response) => {
        try{
            const refreshTokenParams = strictCheck(req.refreshTokenRequest, 500, "Internal Server Error");

            const result = await this.oAuthService.refreshToken(refreshTokenParams);

			res.status(200).json({
				success: true,
				message: "Token has been refreshed Successfully",
				data: result
			});

        }catch(error){errorHandling(error,res);};
    }
}
