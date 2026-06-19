import type { RequestHandler } from "express";
import { errorHandling, strictCheck } from "../utils/ApplicationError.js";
import SessionRepository from "../repositories/SessionRepository.js";
import type { Session } from "../types/dbSchema.js";

export default class TokenAuthMiddleware {
	private sessionRepository: SessionRepository;

	constructor(sessionRepository: SessionRepository) {
		this.sessionRepository = sessionRepository;
	}

	/**
	 * Middleware to validate session and inject details into request
	 *
	 * Inorder Flow:
	 * - Retrieve and check token format
	 * - Get the session using token
	 * - Inject the data into the request
	 * - Pass onto next middleware
	 *
	 * @remarks
	 * The injected data-
	 * - sessionId
	 * - access depending on entity type (user | organization). The following fields are present (id, email)
	 */
	checkAuthToken: RequestHandler = async (req, res, next) => {
		try {
			const token: string = strictCheck(req.cookies["authToken"], 401, "Unauthorized");
			strictCheck(token.startsWith("session_"), 401, "Invalid session token");

			const session: Session = strictCheck(await this.sessionRepository.findActiveSessionById(token), 401, "Session does not exist");

			// guarenteed data on protected routes
			req.sessionId = session.sessionId;
			if (session.type === "user") {
				req.user = {
					id: session.entityId,
					email: session.email,
				};
			}
			if (session.type === "organization") {
				req.organization = {
					id: session.entityId,
					email: session.email,
				};
			}

			next();
		} catch (error) {
			errorHandling(error, res);
		}
	};

	/**
	 * Middleware to validate user session and inject details into request
	 *
	 * Inorder Flow:
	 * - Retrieve and check token format
	 * - Get the User session using token (wont work for organization session)
	 * - Inject the data into the request
	 * - Pass onto next middleware
	 *
	 * @remarks
	 * The injected data-
	 * - sessionId
	 * - The following user fields are present- (id, email)
	 */
	checkUserAuthToken: RequestHandler = async (req, res, next) => {
		try {
			const token: string = strictCheck(req.cookies["authToken"], 401, "Unauthorized");
			strictCheck(token.startsWith("session_"), 401, "Invalid session token");

			const session: Session = strictCheck(await this.sessionRepository.findActiveUserSessionById(token), 401, "Session does not exist");

			// guarenteed data on protected routes
			req.sessionId = session.sessionId;
			req.user = {
				id: session.entityId,
				email: session.email,
			};

			next();
		} catch (error) {
			res.clearCookie("authToken");
			errorHandling(error, res);
		}
	};

	/**
	 * Middleware to validate organization session and inject details into request
	 *
	 * Inorder Flow:
	 * - Retrieve and check token format
	 * - Get the Organization session using token (wont work for user session)
	 * - Inject the data into the request
	 * - Pass onto next middleware
	 *
	 * @remarks
	 * The injected data-
	 * - sessionId
	 * - The following organization fields are present- (id, email)
	 */
	checkOrganizationAuthToken: RequestHandler = async (req, res, next) => {
		try {
			const token: string = strictCheck(req.cookies["authToken"], 401, "Unauthorized");
			strictCheck(token.startsWith("session_"), 401, "Invalid session token");

			const session: Session = strictCheck(
				await this.sessionRepository.findActiveOrganizationSessionById(token),
				401,
				"Session does not exist",
			);

			// guarenteed data on protected routes
			req.sessionId = session.sessionId;
			req.organization = {
				id: session.entityId,
				email: session.email,
			};

			next();
		} catch (error) {
			res.clearCookie("authToken");
			errorHandling(error, res);
		}
	};
}
