import type { Request, RequestHandler } from "express";
import { errorHandling, strictCheck } from "../utils/ApplicationError.js";
import { validationSchema, type Field } from "../utils/ValidationSchema.js";


export default class ValidationMiddlewares {
	constructor() {}
	
	/**
	 * @private 
	 * Validates specific fields as per the validation schema
	 * 
	 * Inorder flow:
	 * - Validate data as per the validation schema
	 */
	private validateData(field: Field, data: unknown): void {
		
		const result = validationSchema[field].safeParse(data);
		strictCheck(result.success, 400,  result.error?.issues[0]?.message ?? "Invalid Input");
	}

	/**
	 * @private
	 * Validates if required fields are present in the request body
	 * 
	 * Inorder flow:
	 * - Check if body is present
	 * - Check if all required fields are present
	 */
	private validateRequiredFields(req: Request, ...fields: string[]): void {
		const body = req.body;
		strictCheck(body, 400, "Invalid Data");

		const status = fields.every(field => field in body);
		strictCheck(status, 400, "Some or all required fields are missing");
	}

	/**
	 * @private
	 * Validates if required fields are present in the request query
	 * 
	 * Inorder flow:
	 * - Check if query is present
	 * - Check if all required fields are present
	 */
	private validateRequiredQuery(req: Request, ...fields: string[]): void {
		const query = req.query;
		strictCheck(query, 400, "Invalid Query Parameters");

		const status = fields.every(field => field in query);
		strictCheck(status, 400, "Some or all required Query parameters are missing");
	}

	/**
	 * @private
	 * Validates if required fields are present in the request parameters
	 * 
	 * Inorder flow:
	 * - Check if params is present
	 * - Check if all required fields are present
	 */
	private validateRequiredParams(req: Request, ...fields: string[]): void{
		const params = req.params;
		strictCheck(params, 400, "Invalid Parameters");

		const status = fields.every(field => field in params);
		strictCheck(status, 400, "Some or all required parameters are missing");
	}

	/**
	 * Validation of user signup incoming data 
	 * 
	 * Inorder Flow:
	 * - validate and retrieve existing fields from request body
	 * - validate each field
	 * - convert email to lowercase and trim extra white spaces
	 * - pass the control to the next middleware
	 * 
	 * @remarks
	 * checks for name, email, password in request body
	 */
	userSignup: RequestHandler = (req, res, next) => {
		try {
			this.validateRequiredFields(req, "name", "email", "password");
			const { name, email, password } = req.body;

			this.validateData("name", name);
			this.validateData("email", email.toLowerCase().trim());
			this.validateData("password", password);

			req.body.email = email.toLowerCase().trim();

			next();
		} catch (error) {
			errorHandling(error, res);
		}
	};

	/**
	 * Validation of login incoming data 
	 * 
	 * Inorder Flow:
	 * - validate and retrieve existing fields from request body
	 * - validate each field
	 * - convert email to lowercase and trim extra white spaces
	 * - pass the control to the next middleware
	 * 
	 * @remarks
	 * checks for email, password in request body
	 */
	login: RequestHandler = (req, res, next) => {
		try {
			this.validateRequiredFields(req, "email", "password");
			const { email, password } = req.body;

			this.validateData("email", email.toLowerCase().trim());
			this.validateData("password", password);

			req.body.email = email.toLowerCase().trim();

			next();
		} catch (error) {
			errorHandling(error, res);
		}
	};

	/**
	 * Validation of organization signup incoming data 
	 * 
	 * Inorder Flow:
	 * - validate and retrieve existing fields from request body
	 * - validate each field
	 * - convert email to lowercase and trim extra white spaces
	 * - pass the control to the next middleware
	 * 
	 * @remarks
	 * checks for userName, email, password, organizationName, domain in request body
	 */
	orgSignup: RequestHandler = (req, res, next) => {
		try {
			this.validateRequiredFields(req, "userName", "email", "password", "organizationName", "domain");
			const { userName, email, password, organizationName, domain } = req.body;

			this.validateData("name", userName);
			this.validateData("email", email.toLowerCase().trim());
			this.validateData("password", password);
			this.validateData("organizationName", organizationName);
			this.validateData("domain", domain);

			req.body.email = email.toLowerCase().trim();

			next();
		} catch (error) {
			errorHandling(error, res);
		}
	};

	/**
	 * Validation of consent incoming data 
	 * 
	 * Inorder Flow:
	 * - validate and retrieve existing fields from request body
	 * - validate each field
	 * - pass the control to the next middleware
	 * 
	 * @remarks
	 * checks for client_id, scopes, consent in request body
	 */
	consent: RequestHandler = (req, res, next) => {
		try {
			this.validateRequiredFields(req, 'client_id', 'scopes', 'consent');

			this.validateData('client_id', req.body.client_id);
			this.validateData('scopes', req.body.scopes);
			this.validateData('boolean', req.body.consent);

			next();
		}catch(err){errorHandling(err, res);};
	}

	/**
	 * Validation of Authorize incoming data
	 * 
	 * Inorder Flow:
	 * - validate and retrieve existing fields from request query
	 * - validate each field
	 * - inject the validated fields to req authorizationRequest object
	 * - pass the control to the next middleware
	 * 
	 * @remarks
	 * checks for client_id, redirect_uri, response_type, state, scopes, challenge_method, code_challenge
	 */
	authorize: RequestHandler = (req, res, next) => {
		try {
			this.validateRequiredQuery(req, "client_id", "redirect_uri", "response_type", "state", "scopes", "challenge_method", "code_challenge");
			const { client_id, redirect_uri, response_type, state, challenge_method, scopes, code_challenge } = req.query;

			this.validateData("client_id", client_id);
			this.validateData("redirect_uri", redirect_uri);
			this.validateData("response_type", response_type);
			this.validateData("state", state);-
			this.validateData("challenge_method", challenge_method);
			this.validateData("scopes", (scopes as string).trim()?.split(" "));
			this.validateData("code_challenge", code_challenge);

			req.authorizationRequest = {
				clientId: client_id as string,
				redirectUri: redirect_uri as string,
				responseType: response_type as "code",
				state: state as string,
				challengeMethod: challenge_method as "S256",
				scope: (scopes as string).trim()?.split(" "),
				codeChallenge: code_challenge as string
			}

			next();
		} catch (error) {
			errorHandling(error, res);
		}
	};

	/**
	 * Validation of Token incoming data
	 * 
	 * Inorder Flow:
	 * - validate and retrieve existing fields from request body
	 * - validate each field
	 * - inject the validated fields to req tokenizationRequest object
	 * - pass the control to the next middleware
	 * 
	 * @remarks
	 * checks for client_id, client_secret, code, code_verifier
	 */
	tokenize: RequestHandler = (req, res, next) => {
		try {
			this.validateRequiredFields(req, "client_id", "client_secret", "code", "code_verifier");
			const { client_id, code, code_verifier, client_secret } = req.body;

			this.validateData("client_id", client_id);
			this.validateData("authCode", code);
			this.validateData("code_verifier", code_verifier);
			this.validateData("client_secret", client_secret);

			req.tokenizationRequest = {
				clientId: client_id as string,
				clientSecret: client_secret as string,
				code: code as string,
				codeVerifier: code_verifier as string
			}

			next();
		} catch (error) {
			errorHandling(error, res);
		}
	};

	/**
	 * Validation of refresh token incoming data
	 * 
	 * Inorder Flow:
	 * - validate and retrieve existing fields from request body
	 * - validate each field
	 * - inject the validated fields to req refreshTokenRequest object
	 * - pass the control to the next middleware
	 * 
	 * @remarks
	 * checks for refresh_token, client_id, client_secret
	 */
	refreshToken: RequestHandler = (req, res, next) => {
		try {
			this.validateRequiredFields(req, "refresh_token", "client_id", "client_secret");
			const { refresh_token, client_id, client_secret } = req.body;

			this.validateData("refresh_token", refresh_token);
			this.validateData("client_id", client_id);
			this.validateData("client_secret", client_secret);

			req.refreshTokenRequest = {
				refreshToken: refresh_token as string,
				clientId: client_id as string,
				clientSecret: client_secret as string
			}

			next();
		} catch (error) {
			errorHandling(error, res);
		}
	};

	/**
	 * Validation of magic token
	 * 
	 * Inorder Flow:
	 * - validate and retrieve existing fields from request params
	 * - validate magicToken field
	 * - pass the control to the next middleware
	 * 
	 * @remarks
	 * checks for magicTokne
	 */
	verifyMagicToken: RequestHandler = (req, res, next) => {
		try{
			this.validateRequiredParams(req, 'magicToken');
			const { magicToken } = req.params;

			this.validateData("magicToken", magicToken);

			next();
		}catch (error){
			errorHandling(error, res);
		}
	}

	/**
	 * Validation of update User Profile incoming data 
	 * 
	 * Inorder Flow:
	 * - validate and retrieve existing fields from request body
	 * - validate each field
	 * - pass the control to the next middleware
	 * 
	 * @remarks
	 * checks for name, email, age, gender in request body
	 */
	validateUpdateProfile: RequestHandler = ( req, res, next )  =>{
		
		try {
			this.validateRequiredFields(req, 'name', 'email', 'age', "gender");
			const { name, email, age, gender } = req.body;
			
			this.validateData('name', name);
			this.validateData('email', email);
			this.validateData('age', age);
			this.validateData('gender', gender);

			next();
		} catch (error) {
			errorHandling(error, res);
		}
	}

	/**
	 * Validation of create client incoming data 
	 * 
	 * Inorder Flow:
	 * - validate and retrieve existing fields from request body
	 * - validate each field
	 * - pass the control to the next middleware
	 * 
	 * @remarks
	 * checks for clientName, redirectUri, responseType, scopes in request body
	 */
	validateCreateClient: RequestHandler = (req, res, next) => {
		try {
			this.validateRequiredFields(req, "clientName", "redirectUri", "responseType", "scopes");
			const { clientName, redirectUri, responseType, scopes } = req.body;

			this.validateData("name", clientName);
			this.validateData("redirect_uri", redirectUri);
			this.validateData("response_type", responseType);
			this.validateData("scopes", scopes);

			next();
		} catch (error) {
			errorHandling(error, res);
		}
	}
}
