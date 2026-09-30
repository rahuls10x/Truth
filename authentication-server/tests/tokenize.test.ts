import { describe, it, expect, vi, beforeEach } from "vitest";
import OAuthService from "../src/services/OAuthService.js";
import ApplicationError from "../src/utils/ApplicationError.js";
import type { TokenizationBody } from "../src/types/index.js";
import type { AuthenticationCode } from "../src/types/dbSchema.js";
import crypto from "crypto";

describe("OAuth /token (Tokenize) - Success Flows", () => {
	let clientRepositoryMock: any;
	let tokenRepositoryMock: any;
	let consentRepositoryMock: any;
	let oAuthService: OAuthService;

	const sampleVerifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";
	const sampleChallenge = crypto.createHash("sha256").update(sampleVerifier).digest("base64url");

	const sampleTokenizationBody: TokenizationBody = {
		code: "auth_12345678901234567890123456789012",
		clientId: "client_12345678901234567890123456789012",
		clientSecret: "secret_12345678901234567890123456789012",
		codeVerifier: sampleVerifier,
	};

	const sampleAuthCode: AuthenticationCode = {
		code: sampleTokenizationBody.code,
		clientId: sampleTokenizationBody.clientId,
		userId: "user_12345678901234567890123456789012",
		codeChallenge: sampleChallenge,
		challengeMethod: "S256",
		scopes: ["name", "email"],
	};

	beforeEach(() => {
		clientRepositoryMock = {
			findByClientId: vi.fn(),
		};
		tokenRepositoryMock = {
			getAndDeleteCachedAuthorizationCode: vi.fn(),
			cacheAccessToken: vi.fn(),
			createAccessToken: vi.fn(),
			createRefreshToken: vi.fn(),
		};
		consentRepositoryMock = {
			getWaiverByUserIdAndClientId: vi.fn(),
		};
		oAuthService = new OAuthService(clientRepositoryMock, tokenRepositoryMock, consentRepositoryMock);
	});

	it("Successfully issued", async () => {
		tokenRepositoryMock.getAndDeleteCachedAuthorizationCode.mockResolvedValue(sampleAuthCode);
		clientRepositoryMock.findByClientId.mockResolvedValue({
			clientId: sampleTokenizationBody.clientId,
			clientSecret: sampleTokenizationBody.clientSecret,
			clientName: "Test App",
		});
		tokenRepositoryMock.cacheAccessToken.mockResolvedValue(true);
		tokenRepositoryMock.createAccessToken.mockResolvedValue(true);
		tokenRepositoryMock.createRefreshToken.mockResolvedValue(true);

		const result = await oAuthService.tokenize(sampleTokenizationBody);

		expect(result).toMatchObject({
			access_token: expect.stringMatching(/^at_/),
			refresh_token: expect.stringMatching(/^rt_/),
			token_type: "Bearer",
			expires_in: 3600000,
			scopes: ["name", "email"],
		});
		expect(tokenRepositoryMock.getAndDeleteCachedAuthorizationCode).toHaveBeenCalledWith(sampleTokenizationBody.code);
		expect(clientRepositoryMock.findByClientId).toHaveBeenCalledWith(sampleTokenizationBody.clientId);
		expect(tokenRepositoryMock.cacheAccessToken).toHaveBeenCalled();
		expect(tokenRepositoryMock.createAccessToken).toHaveBeenCalled();
		expect(tokenRepositoryMock.createRefreshToken).toHaveBeenCalled();
	});
});

describe("OAuth /token (Tokenize) - Error States", () => {
	let clientRepositoryMock: any;
	let tokenRepositoryMock: any;
	let consentRepositoryMock: any;
	let oAuthService: OAuthService;

	const sampleVerifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";
	const sampleChallenge = crypto.createHash("sha256").update(sampleVerifier).digest("base64url");

	const sampleTokenizationBody: TokenizationBody = {
		code: "auth_12345678901234567890123456789012",
		clientId: "client_12345678901234567890123456789012",
		clientSecret: "secret_12345678901234567890123456789012",
		codeVerifier: sampleVerifier,
	};

	const sampleAuthCode: AuthenticationCode = {
		code: sampleTokenizationBody.code,
		clientId: sampleTokenizationBody.clientId,
		userId: "user_12345678901234567890123456789012",
		codeChallenge: sampleChallenge,
		challengeMethod: "S256",
		scopes: ["name", "email"],
	};

	beforeEach(() => {
		clientRepositoryMock = {
			findByClientId: vi.fn(),
		};
		tokenRepositoryMock = {
			getAndDeleteCachedAuthorizationCode: vi.fn(),
			cacheAccessToken: vi.fn(),
			createAccessToken: vi.fn(),
			createRefreshToken: vi.fn(),
		};
		consentRepositoryMock = {
			getWaiverByUserIdAndClientId: vi.fn(),
		};
		oAuthService = new OAuthService(clientRepositoryMock, tokenRepositoryMock, consentRepositoryMock);
	});

	it("Authcode is Invalid or expired", async () => {
		tokenRepositoryMock.getAndDeleteCachedAuthorizationCode.mockResolvedValue(null);

		await expect(oAuthService.tokenize(sampleTokenizationBody)).rejects.toThrow(ApplicationError);
		await expect(oAuthService.tokenize(sampleTokenizationBody)).rejects.toMatchObject({
			statusCode: 400,
			message: "Authorization code is invalid or expired",
		});
	});

	it("unauthorized client id", async () => {
		tokenRepositoryMock.getAndDeleteCachedAuthorizationCode.mockResolvedValue({
			...sampleAuthCode,
			clientId: "client_different123456789012345678",
		});

		await expect(oAuthService.tokenize(sampleTokenizationBody)).rejects.toThrow(ApplicationError);
		await expect(oAuthService.tokenize(sampleTokenizationBody)).rejects.toMatchObject({
			statusCode: 400,
			message: "Unauthorized client id",
		});
	});

	it("client not found", async () => {
		tokenRepositoryMock.getAndDeleteCachedAuthorizationCode.mockResolvedValue(sampleAuthCode);
		clientRepositoryMock.findByClientId.mockResolvedValue(null);

		await expect(oAuthService.tokenize(sampleTokenizationBody)).rejects.toThrow(ApplicationError);
		await expect(oAuthService.tokenize(sampleTokenizationBody)).rejects.toMatchObject({
			statusCode: 400,
			message: "Client not found",
		});
	});

	it("unauthorized client secret", async () => {
		tokenRepositoryMock.getAndDeleteCachedAuthorizationCode.mockResolvedValue(sampleAuthCode);
		clientRepositoryMock.findByClientId.mockResolvedValue({
			clientId: sampleTokenizationBody.clientId,
			clientSecret: "secret_wrongsecret1234567890123456",
		});

		await expect(oAuthService.tokenize(sampleTokenizationBody)).rejects.toThrow(ApplicationError);
		await expect(oAuthService.tokenize(sampleTokenizationBody)).rejects.toMatchObject({
			statusCode: 400,
			message: "Unauthorized client secret",
		});
	});

	it("Unauthorized code verifier", async () => {
		tokenRepositoryMock.getAndDeleteCachedAuthorizationCode.mockResolvedValue(sampleAuthCode);
		clientRepositoryMock.findByClientId.mockResolvedValue({
			clientId: sampleTokenizationBody.clientId,
			clientSecret: sampleTokenizationBody.clientSecret,
		});

		const invalidVerifierBody: TokenizationBody = {
			...sampleTokenizationBody,
			codeVerifier: "invalid_code_verifier_12345678901234567890",
		};

		await expect(oAuthService.tokenize(invalidVerifierBody)).rejects.toThrow(ApplicationError);
		await expect(oAuthService.tokenize(invalidVerifierBody)).rejects.toMatchObject({
			statusCode: 400,
			message: "Code verifier does not match to code challenge",
		});
	});

	it("Failed to cache accss token", async () => {
		tokenRepositoryMock.getAndDeleteCachedAuthorizationCode.mockResolvedValue(sampleAuthCode);
		clientRepositoryMock.findByClientId.mockResolvedValue({
			clientId: sampleTokenizationBody.clientId,
			clientSecret: sampleTokenizationBody.clientSecret,
		});
		tokenRepositoryMock.cacheAccessToken.mockResolvedValue(false);

		await expect(oAuthService.tokenize(sampleTokenizationBody)).rejects.toThrow(ApplicationError);
		await expect(oAuthService.tokenize(sampleTokenizationBody)).rejects.toMatchObject({
			statusCode: 500,
			message: "Failed to cache access token",
		});
	});

	it("Failed to create access token", async () => {
		tokenRepositoryMock.getAndDeleteCachedAuthorizationCode.mockResolvedValue(sampleAuthCode);
		clientRepositoryMock.findByClientId.mockResolvedValue({
			clientId: sampleTokenizationBody.clientId,
			clientSecret: sampleTokenizationBody.clientSecret,
		});
		tokenRepositoryMock.cacheAccessToken.mockResolvedValue(true);
		tokenRepositoryMock.createAccessToken.mockResolvedValue(false);

		await expect(oAuthService.tokenize(sampleTokenizationBody)).rejects.toThrow(ApplicationError);
		await expect(oAuthService.tokenize(sampleTokenizationBody)).rejects.toMatchObject({
			statusCode: 500,
			message: "Failed to create access token",
		});
	});

	it("Failed to create refresh token", async () => {
		tokenRepositoryMock.getAndDeleteCachedAuthorizationCode.mockResolvedValue(sampleAuthCode);
		clientRepositoryMock.findByClientId.mockResolvedValue({
			clientId: sampleTokenizationBody.clientId,
			clientSecret: sampleTokenizationBody.clientSecret,
		});
		tokenRepositoryMock.cacheAccessToken.mockResolvedValue(true);
		tokenRepositoryMock.createAccessToken.mockResolvedValue(true);
		tokenRepositoryMock.createRefreshToken.mockResolvedValue(false);

		await expect(oAuthService.tokenize(sampleTokenizationBody)).rejects.toThrow(ApplicationError);
		await expect(oAuthService.tokenize(sampleTokenizationBody)).rejects.toMatchObject({
			statusCode: 500,
			message: "Failed to create refresh token",
		});
	});
});
