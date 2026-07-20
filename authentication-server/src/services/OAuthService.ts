import type { AuthenticationCode, Token, UserConsent } from "../types/dbSchema.js";
import type ClientRepository from "../repositories/ClientRepository.js";
import type { AuthorizationQuery, ConsentQuery, RefreshTokenParams, TokenizationBody, TokenPayload } from "../types/index.js";
import { strictCheck } from "../utils/ApplicationError.js";
import CryptoService from "./CryptoService.js";
import type TokenRepository from "../repositories/TokenRepository.js";
import type ConsentRepository from "../repositories/ConsentRepository.js";
import { arraysEqual } from "../utils/utilFunctions.js";


export default class OAuthService {
	private clientRepository: ClientRepository;
	private tokenRepository: TokenRepository;
	private consentRepository: ConsentRepository;

	constructor(clientRepository: ClientRepository, tokenRepository: TokenRepository, consentRepository: ConsentRepository) {
		this.clientRepository = clientRepository;
		this.tokenRepository = tokenRepository;
		this.consentRepository = consentRepository;
	}

	/**
	 *  Creates and retrieves a consent url
	 * 
	 * Inorder Flow:
	 * - creates consent page url,attach client name and return it
	 */
	private createConsentUrl(oAuthQuery: AuthorizationQuery, clientName:string): string {
		const urlParams = new URLSearchParams({
			client_id: oAuthQuery.clientId,
			redirect_uri: oAuthQuery.redirectUri,
			response_type: oAuthQuery.responseType,
			state: oAuthQuery.state,
			scope: oAuthQuery.scope.join(" "),
			challenge_method: oAuthQuery.challengeMethod,
			code_challenge: oAuthQuery.codeChallenge,
			client_name:clientName
		});
		return `${process.env.ORIGIN_URL}/consent?${urlParams.toString()}`;// change this url later
	}

	/**
	 * Issues a temporary authorization code and returns the redirect url
	 * 
	 * Inorder Flow:
	 * - generate the temporary code and expiry
	 * - create authentication code object
	 * - cache and verify the temporary code creation
	 * - create redirect url and return it
	 */
	private async issueAuthorizationCode(oAuthQuery: AuthorizationQuery): Promise<string> {
		const temporaryCode = CryptoService.generateCode();
		const expiry = 40000;

		const authenticationCode: AuthenticationCode = {
			code: temporaryCode,
			clientId: oAuthQuery.clientId,
			userId: oAuthQuery.userId,
			codeChallenge: oAuthQuery.codeChallenge,
			challengeMethod: oAuthQuery.challengeMethod,
			scopes: oAuthQuery.scope,
		};

		strictCheck(
			await this.tokenRepository.cacheAuthorizationCode(temporaryCode, authenticationCode, expiry),
			400,
			"Failed to create authorization code",
		);

		const urlParams = new URLSearchParams({
			response_type: oAuthQuery.responseType,
			state: oAuthQuery.state,
			code: temporaryCode,
			expiresIn: (expiry / 1000).toString(),
		});
		const redirectUrl = `${oAuthQuery.redirectUri}?${urlParams.toString()}`;
		return redirectUrl;
	}

	/**
     * @private Retrieves token payload DTo and creates new access and refresh tokens
	 * 
	 * Inorder Flow:
     * - generate access and refresh tokens
	 * - creates token objects and relative expiry
	 * - cache and verify access and refresh token creation (only access token is cached)
	 * - create and return token payload DTO
     */
    private async createTokenPayload(clientId:string, userId:string, scopes:string[]): Promise<TokenPayload>{
        const accessToken = CryptoService.generateAccessToken();
        const refreshToken = CryptoService.generateRefreshToken();

		const accessTokenRelativeExpiry = 60 * 60 * 1000
        const accessTokenPayload:Token = {
            tokenString: accessToken,
            clientId: clientId,
            userId: userId,
            scopes: scopes,
            expiresAt:new Date(Date.now() + accessTokenRelativeExpiry),
            isActive: true
        }
        const refreshTokenPayload:Token = {
            tokenString: refreshToken,
            clientId: clientId,
            userId: userId,
            scopes: scopes,
            expiresAt:new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            isActive: true
        }

		strictCheck(await this.tokenRepository.cacheAccessToken(accessToken, accessTokenPayload, accessTokenRelativeExpiry), 500, "Failed to cache access token");
        strictCheck(await this.tokenRepository.createAccessToken(accessTokenPayload), 500, "Failed to create access token");
        strictCheck(await this.tokenRepository.createRefreshToken(refreshTokenPayload), 500, "Failed to create refresh token");
        
        const tokenPayloadDTO:TokenPayload = {
            access_token: accessToken,
            token_type: "Bearer",
            expires_in: 60 * 60 * 1000,
            refresh_token: refreshToken,
            scopes: scopes
        }
        return tokenPayloadDTO;
    }

	/**
	 * Creates user consent 
	 * 
	 * Inorder Flow:
	 * - Checks if client exists
	 * - Creates user consent object
	 * - Creates user consent using user consent object
	 */
	async consent(consentQuery:ConsentQuery): Promise<void> {
		
		strictCheck(await this.clientRepository.findByClientId(consentQuery.clientId), 400, "Client not found");

		const consentPayload:UserConsent = {
			userId: consentQuery.userId,
			clientId: consentQuery.clientId,
			consent: consentQuery.consent,
			scopes: consentQuery.scopes,
			isRevoked: false,
			createdAt: new Date(),
			updatedAt: new Date()
		}

		strictCheck(await this.consentRepository.createUserConsent(consentPayload), 500, "Failed to create user consent");
	}

	/**
	 * Retrieves redirect url for authorization request
	 * 
	 * Inorder Flow:
	 * - checks and retrieves if client exists
	 * - checks if redirect uri and response type are valid
	 * - retrieves the waiver if it exists
	 * - checks if waiver exists and if scopes match then issue authorization code (Waiver exists)
	 * - create consent page url along with client name and returns it (Waiver does not exist)
	 */
	async authorize(oAuthQuery: AuthorizationQuery): Promise<string> {
		const client = strictCheck(await this.clientRepository.findByClientId(oAuthQuery.clientId), 400, "Client not found");

		strictCheck(client.redirectUri === oAuthQuery.redirectUri, 400, "Invalid redirect uri");
		strictCheck(client.responseType === oAuthQuery.responseType, 400, "Invalid response type");

		const waiver = await this.consentRepository.getWaiverByUserIdAndClientId(oAuthQuery.userId, oAuthQuery.clientId);

		if (waiver && arraysEqual(waiver.scopes, oAuthQuery.scope)) { // add a client check for scopes as well
			return await this.issueAuthorizationCode(oAuthQuery); //waiver exists
		}

		const consentUrl = this.createConsentUrl(oAuthQuery, client.clientName);
		return consentUrl;
	}

	/**
     * Retrieves Token Payload DTO from authorization code
     * 
	 * Inorder Flow:
	 * - retrieves and deletes the existing authorization code and matches the client id
	 * - retrieves the client and matches the client secret
	 * - matches the code verifier
	 * - retrieves and returns the token payload DTO
	 * 
     * 
     * @refinement
     * Implement a JWS verification later instead of opaque token
     */
	async tokenize(tokenizationBody: TokenizationBody) : Promise<TokenPayload>{
		const authenticationCode = strictCheck(await this.tokenRepository.getAndDeleteCachedAuthorizationCode(tokenizationBody.code), 400, "Authorization code is invalid or expired");
		strictCheck(authenticationCode.clientId === tokenizationBody.clientId, 400, "Unauthorized client id");

        const client = strictCheck(await this.clientRepository.findByClientId(tokenizationBody.clientId), 400, "Client not found");
        strictCheck(client.clientSecret === tokenizationBody.clientSecret, 400, "Unauthorized client secret");

		strictCheck(CryptoService.verifyCodeChallenge(authenticationCode.challengeMethod, authenticationCode.codeChallenge, tokenizationBody.codeVerifier), 400, "Code verifier does not match to code challenge");

		const tokenPayload = await this.createTokenPayload(authenticationCode.clientId, authenticationCode.userId, authenticationCode.scopes);
        return tokenPayload;
	}

	/**
     * Retrieves Token Payload DTO from refresh token
     * 
	 * Inorder Flow:
	 * - retrieves the parameters
	 * - retrieves the existing refresh token and matches the client id
	 * - retrieves and checks the client and matches the client secret
	 * - retrieves the token payload DTO
	 * - deletes the existing refresh token (deactivates it)
	 * - returns the token payload
     * 
     * @refinement
     * Implement a threat detection system when revoked Refresh token is used
     * 
     */
    async refreshToken(params:RefreshTokenParams):Promise<TokenPayload>{

		const {refreshToken, clientId, clientSecret} = params;

        const existingRefreshToken = strictCheck(await this.tokenRepository.getRefreshToken(refreshToken), 400, "Refresh token is invalid or expired");
        strictCheck(existingRefreshToken.clientId === clientId, 400, "Unauthorized client id");
		
        const client = strictCheck(await this.clientRepository.findByClientId(clientId), 400, "Client not found");
        strictCheck(client.clientSecret === clientSecret, 400, "Unauthorized client secret");

        const tokenPayload = await this.createTokenPayload(clientId, existingRefreshToken.userId, existingRefreshToken.scopes);

        strictCheck(await this.tokenRepository.deactivateToken(refreshToken), 400, "Failed to delete refresh token");

        return tokenPayload;
    }
}
