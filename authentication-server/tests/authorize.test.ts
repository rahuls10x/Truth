import { describe, it, expect, vi, beforeEach } from "vitest";
import OAuthService from "../src/services/OAuthService.js";
import TokenAuthMiddleware from "../src/middlewares/TokenAuthMiddleware.js";
import AuthorizationError from "../src/utils/AuthorizationError.js";
import type { AuthorizationQuery } from "../src/types/index.js";

describe("OAuth /authorize - Success Flows", () => {
	let clientRepositoryMock: any;
	let tokenRepositoryMock: any;
	let consentRepositoryMock: any;
	let oAuthService: OAuthService;

	const sampleQuery: AuthorizationQuery = {
		clientId: "client_12345678901234567890123456789012",
		redirectUri: "https://example.com/callback",
		responseType: "code",
		state: "xyzState",
		challengeMethod: "S256",
		scope: ["name", "email"],
		codeChallenge: "E9Melhoa2OwvFrGMTJguCH5rtx64LxPU6CSnkArKlpc+",
		userId: "user_12345678901234567890123456789012",
	};

	beforeEach(() => {
		process.env.ORIGIN_URL= "http://localhost:5173";
		clientRepositoryMock = {
			findByClientId: vi.fn(),
		};
		tokenRepositoryMock = {
			cacheAuthorizationCode: vi.fn(),
		};
		consentRepositoryMock = {
			getWaiverByUserIdAndClientId: vi.fn(),
		};
		oAuthService = new OAuthService(clientRepositoryMock, tokenRepositoryMock, consentRepositoryMock);
	});

	it("Successful Authorize request", async () => {
		clientRepositoryMock.findByClientId.mockResolvedValue({
			clientId: sampleQuery.clientId,
			clientName: "Test App",
			redirectUri: sampleQuery.redirectUri,
			responseType: "code",
		});
		consentRepositoryMock.getWaiverByUserIdAndClientId.mockResolvedValue({
			userId: sampleQuery.userId,
			clientId: sampleQuery.clientId,
			scopes: sampleQuery.scope,
		});
		tokenRepositoryMock.cacheAuthorizationCode.mockResolvedValue(true);

		const result = await oAuthService.authorize(sampleQuery);

		expect(result).toContain("https://example.com/callback?");
		expect(result).toContain("code=");
		expect(result).toContain("state=xyzState");
		expect(result).toContain("response_type=code");
	});

	it("Successful authorize request without consent", async () => {
		clientRepositoryMock.findByClientId.mockResolvedValue({
			clientId: sampleQuery.clientId,
			clientName: "Test App",
			redirectUri: sampleQuery.redirectUri,
			responseType: "code",
		});
		consentRepositoryMock.getWaiverByUserIdAndClientId.mockResolvedValue(null);

		const result = await oAuthService.authorize(sampleQuery);

		expect(result).toContain("http://localhost:5173/consent?");
		expect(result).toContain("client_id=" + sampleQuery.clientId);
		expect(result).toContain("client_name=Test+App");
		expect(result).toContain("redirect_uri=https%3A%2F%2Fexample.com%2Fcallback");
		expect(result).toContain("scope=name+email");
		expect(result).toContain("state=xyzState");
	});
});


describe("OAuth /authorize - 5 Error states", () => {
	let clientRepositoryMock: any;
	let tokenRepositoryMock: any;
	let consentRepositoryMock: any;
	let sessionRepositoryMock: any;
	let oAuthService: OAuthService;
	let tokenAuthMiddleware: TokenAuthMiddleware;

	const sampleQuery: AuthorizationQuery = {
		clientId: "client_12345678901234567890123456789012",
		redirectUri: "https://example.com/callback",
		responseType: "code",
		state: "xyzState",
		challengeMethod: "S256",
		scope: ["name", "email"],
		codeChallenge: "E9Melhoa2OwvFrGMTJguCH5rtx64LxPU6CSnkArKlpc",
		userId: "user_12345678901234567890123456789012",
	};

	beforeEach(() => {
		process.env.ORIGIN_URL = "http://localhost:5173";
		process.env["APP_URL"] = "http://localhost:4000";

		clientRepositoryMock = {
			findByClientId: vi.fn(),
		};
		tokenRepositoryMock = {
			cacheAuthorizationCode: vi.fn(),
		};
		consentRepositoryMock = {
			getWaiverByUserIdAndClientId: vi.fn(),
		};
		sessionRepositoryMock = {
			findActiveUserSessionById: vi.fn(),
		};

		oAuthService = new OAuthService(clientRepositoryMock, tokenRepositoryMock, consentRepositoryMock);
		tokenAuthMiddleware = new TokenAuthMiddleware(sessionRepositoryMock);
	});

	it("Client not found", async () => {
		clientRepositoryMock.findByClientId.mockResolvedValue(null);

		await expect(oAuthService.authorize(sampleQuery)).rejects.toThrow(AuthorizationError);
		await expect(oAuthService.authorize(sampleQuery)).rejects.toMatchObject({
			error: "invalid_client",
			message: "Client not found",
		});
	});

	it("Invalid Redirect Uri", async () => {
		clientRepositoryMock.findByClientId.mockResolvedValue({
			clientId: sampleQuery.clientId,
			clientName: "Test App",
			redirectUri: "https://other.com/callback",
			responseType: "code",
		});

		await expect(oAuthService.authorize(sampleQuery)).rejects.toThrow(AuthorizationError);
		await expect(oAuthService.authorize(sampleQuery)).rejects.toMatchObject({
			error: "invalid_request",
			message: "Invalid redirect uri",
		});
	});

	it("Invalid Response type", async () => {
		clientRepositoryMock.findByClientId.mockResolvedValue({
			clientId: sampleQuery.clientId,
			clientName: "Test App",
			redirectUri: sampleQuery.redirectUri,
			responseType: "token",
		});

		await expect(oAuthService.authorize(sampleQuery)).rejects.toThrow(AuthorizationError);
		await expect(oAuthService.authorize(sampleQuery)).rejects.toMatchObject({
			error: "unsupported_response_type",
			message: "Invalid response type",
		});
	});

	it("User not signed in", async () => {
		const redirectSpy = vi.fn();
		const statusSpy = vi.fn().mockReturnValue({ redirect: redirectSpy });
		const nextSpy = vi.fn();

		const mockReq: any = {
			cookies: {},
			originalUrl: "/authorize?client_id=xyz&response_type=code",
		};
		const mockRes: any = {
			status: statusSpy,
			redirect: redirectSpy,
		};

		await tokenAuthMiddleware.checkOAuthUserAuthToken(mockReq, mockRes, nextSpy);

		expect(statusSpy).toHaveBeenCalledWith(302);
		expect(redirectSpy).toHaveBeenCalledWith(
			`http://localhost:5173/user/login?next=${encodeURIComponent("http://localhost:4000/authorize?client_id=xyz&response_type=code")}`,
		);
		expect(nextSpy).not.toHaveBeenCalled();
	});

	it("Failed to create Authorization code", async () => {
		clientRepositoryMock.findByClientId.mockResolvedValue({
			clientId: sampleQuery.clientId,
			clientName: "Test App",
			redirectUri: sampleQuery.redirectUri,
			responseType: "code",
		});
		consentRepositoryMock.getWaiverByUserIdAndClientId.mockResolvedValue({
			userId: sampleQuery.userId,
			clientId: sampleQuery.clientId,
			scopes: sampleQuery.scope,
		});
		tokenRepositoryMock.cacheAuthorizationCode.mockResolvedValue(false);

		await expect(oAuthService.authorize(sampleQuery)).rejects.toThrow(AuthorizationError);
		await expect(oAuthService.authorize(sampleQuery)).rejects.toMatchObject({
			error: "server_error",
			message: "Failed to create authorization code",
		});
	});
});
