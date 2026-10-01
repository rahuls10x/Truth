import { describe, it, expect, vi, beforeEach } from "vitest";
import OAuthService from "../src/services/OAuthService.js";
import ApplicationError from "../src/utils/ApplicationError.js";
import type { RefreshTokenParams } from "../src/types/index.js";
import type { Token } from "../src/types/dbSchema.js";

describe("OAuth /refresh (Refresh Token) - Success Flows", () => {
	let clientRepositoryMock: any;
	let tokenRepositoryMock: any;
	let consentRepositoryMock: any;
	let oAuthService: OAuthService;

	const sampleRefreshTokenParams: RefreshTokenParams = {
		refreshToken: "rt_1234567890123456789012345678901234567890123456789012345678901234",
		clientId: "client_12345678901234567890123456789012",
		clientSecret: "secret_12345678901234567890123456789012",
	};

	const sampleStoredRefreshToken: Token = {
		tokenString: sampleRefreshTokenParams.refreshToken,
		clientId: sampleRefreshTokenParams.clientId,
		userId: "user_12345678901234567890123456789012",
		scopes: ["name", "email"],
		expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
		isActive: true,
	};

	beforeEach(() => {
		clientRepositoryMock = {
			findByClientId: vi.fn(),
		};
		tokenRepositoryMock = {
			getRefreshToken: vi.fn(),
			cacheAccessToken: vi.fn(),
			createAccessToken: vi.fn(),
			createRefreshToken: vi.fn(),
			deactivateToken: vi.fn(),
		};
		consentRepositoryMock = {
			getWaiverByUserIdAndClientId: vi.fn(),
		};
		oAuthService = new OAuthService(clientRepositoryMock, tokenRepositoryMock, consentRepositoryMock);
	});

	it("Successfully refreshed", async () => {
		tokenRepositoryMock.getRefreshToken.mockResolvedValue(sampleStoredRefreshToken);
		clientRepositoryMock.findByClientId.mockResolvedValue({
			clientId: sampleRefreshTokenParams.clientId,
			clientSecret: sampleRefreshTokenParams.clientSecret,
			clientName: "Test App",
		});
		tokenRepositoryMock.cacheAccessToken.mockResolvedValue(true);
		tokenRepositoryMock.createAccessToken.mockResolvedValue(true);
		tokenRepositoryMock.createRefreshToken.mockResolvedValue(true);
		tokenRepositoryMock.deactivateToken.mockResolvedValue(true);

		const result = await oAuthService.refreshToken(sampleRefreshTokenParams);

		expect(result).toMatchObject({
			access_token: expect.stringMatching(/^at_/),
			refresh_token: expect.stringMatching(/^rt_/),
			token_type: "Bearer",
			expires_in: 3600000,
			scopes: ["name", "email"],
		});
		expect(tokenRepositoryMock.getRefreshToken).toHaveBeenCalledWith(sampleRefreshTokenParams.refreshToken);
		expect(clientRepositoryMock.findByClientId).toHaveBeenCalledWith(sampleRefreshTokenParams.clientId);
		expect(tokenRepositoryMock.cacheAccessToken).toHaveBeenCalled();
		expect(tokenRepositoryMock.createAccessToken).toHaveBeenCalled();
		expect(tokenRepositoryMock.createRefreshToken).toHaveBeenCalled();
		expect(tokenRepositoryMock.deactivateToken).toHaveBeenCalledWith(sampleRefreshTokenParams.refreshToken);
	});
});


describe("OAuth /refresh (Refresh Token) - Error States", () => {
	let clientRepositoryMock: any;
	let tokenRepositoryMock: any;
	let consentRepositoryMock: any;
	let oAuthService: OAuthService;

	const sampleRefreshTokenParams: RefreshTokenParams = {
		refreshToken: "rt_1234567890123456789012345678901234567890123456789012345678901234",
		clientId: "client_12345678901234567890123456789012",
		clientSecret: "secret_12345678901234567890123456789012",
	};

	const sampleStoredRefreshToken: Token = {
		tokenString: sampleRefreshTokenParams.refreshToken,
		clientId: sampleRefreshTokenParams.clientId,
		userId: "user_12345678901234567890123456789012",
		scopes: ["name", "email"],
		expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
		isActive: true,
	};

	beforeEach(() => {
		clientRepositoryMock = {
			findByClientId: vi.fn(),
		};
		tokenRepositoryMock = {
			getRefreshToken: vi.fn(),
			cacheAccessToken: vi.fn(),
			createAccessToken: vi.fn(),
			createRefreshToken: vi.fn(),
			deactivateToken: vi.fn(),
		};
		consentRepositoryMock = {
			getWaiverByUserIdAndClientId: vi.fn(),
		};
		oAuthService = new OAuthService(clientRepositoryMock, tokenRepositoryMock, consentRepositoryMock);
	});

	it("Refresh token invalid or expired", async () => {
		tokenRepositoryMock.getRefreshToken.mockResolvedValue(null);

		await expect(oAuthService.refreshToken(sampleRefreshTokenParams)).rejects.toThrow(ApplicationError);
		await expect(oAuthService.refreshToken(sampleRefreshTokenParams)).rejects.toMatchObject({
			statusCode: 400,
			message: "Refresh token is invalid or expired",
		});
	});

	it("Unauthorized client id", async () => {
		tokenRepositoryMock.getRefreshToken.mockResolvedValue({
			...sampleStoredRefreshToken,
			clientId: "client_differentclient12345678901234",
		});

		await expect(oAuthService.refreshToken(sampleRefreshTokenParams)).rejects.toThrow(ApplicationError);
		await expect(oAuthService.refreshToken(sampleRefreshTokenParams)).rejects.toMatchObject({
			statusCode: 400,
			message: "Unauthorized client id",
		});
	});

	it("client not found", async () => {
		tokenRepositoryMock.getRefreshToken.mockResolvedValue(sampleStoredRefreshToken);
		clientRepositoryMock.findByClientId.mockResolvedValue(null);

		await expect(oAuthService.refreshToken(sampleRefreshTokenParams)).rejects.toThrow(ApplicationError);
		await expect(oAuthService.refreshToken(sampleRefreshTokenParams)).rejects.toMatchObject({
			statusCode: 400,
			message: "Client not found",
		});
	});

	it("unauthorized client secret", async () => {
		tokenRepositoryMock.getRefreshToken.mockResolvedValue(sampleStoredRefreshToken);
		clientRepositoryMock.findByClientId.mockResolvedValue({
			clientId: sampleRefreshTokenParams.clientId,
			clientSecret: "secret_wrongsecret1234567890123456",
		});

		await expect(oAuthService.refreshToken(sampleRefreshTokenParams)).rejects.toThrow(ApplicationError);
		await expect(oAuthService.refreshToken(sampleRefreshTokenParams)).rejects.toMatchObject({
			statusCode: 400,
			message: "Unauthorized client secret",
		});
	});

	it("Failed to cache access token", async () => {
		tokenRepositoryMock.getRefreshToken.mockResolvedValue(sampleStoredRefreshToken);
		clientRepositoryMock.findByClientId.mockResolvedValue({
			clientId: sampleRefreshTokenParams.clientId,
			clientSecret: sampleRefreshTokenParams.clientSecret,
		});
		tokenRepositoryMock.cacheAccessToken.mockResolvedValue(false);

		await expect(oAuthService.refreshToken(sampleRefreshTokenParams)).rejects.toThrow(ApplicationError);
		await expect(oAuthService.refreshToken(sampleRefreshTokenParams)).rejects.toMatchObject({
			statusCode: 500,
			message: "Failed to cache access token",
		});
	});

	it("failed to create access token", async () => {
		tokenRepositoryMock.getRefreshToken.mockResolvedValue(sampleStoredRefreshToken);
		clientRepositoryMock.findByClientId.mockResolvedValue({
			clientId: sampleRefreshTokenParams.clientId,
			clientSecret: sampleRefreshTokenParams.clientSecret,
		});
		tokenRepositoryMock.cacheAccessToken.mockResolvedValue(true);
		tokenRepositoryMock.createAccessToken.mockResolvedValue(false);

		await expect(oAuthService.refreshToken(sampleRefreshTokenParams)).rejects.toThrow(ApplicationError);
		await expect(oAuthService.refreshToken(sampleRefreshTokenParams)).rejects.toMatchObject({
			statusCode: 500,
			message: "Failed to create access token",
		});
	});

	it("failed to create refresh token", async () => {
		tokenRepositoryMock.getRefreshToken.mockResolvedValue(sampleStoredRefreshToken);
		clientRepositoryMock.findByClientId.mockResolvedValue({
			clientId: sampleRefreshTokenParams.clientId,
			clientSecret: sampleRefreshTokenParams.clientSecret,
		});
		tokenRepositoryMock.cacheAccessToken.mockResolvedValue(true);
		tokenRepositoryMock.createAccessToken.mockResolvedValue(true);
		tokenRepositoryMock.createRefreshToken.mockResolvedValue(false);

		await expect(oAuthService.refreshToken(sampleRefreshTokenParams)).rejects.toThrow(ApplicationError);
		await expect(oAuthService.refreshToken(sampleRefreshTokenParams)).rejects.toMatchObject({
			statusCode: 500,
			message: "Failed to create refresh token",
		});
	});

	it("failed to delete existing token", async () => {
		tokenRepositoryMock.getRefreshToken.mockResolvedValue(sampleStoredRefreshToken);
		clientRepositoryMock.findByClientId.mockResolvedValue({
			clientId: sampleRefreshTokenParams.clientId,
			clientSecret: sampleRefreshTokenParams.clientSecret,
		});
		tokenRepositoryMock.cacheAccessToken.mockResolvedValue(true);
		tokenRepositoryMock.createAccessToken.mockResolvedValue(true);
		tokenRepositoryMock.createRefreshToken.mockResolvedValue(true);
		tokenRepositoryMock.deactivateToken.mockResolvedValue(false);

		await expect(oAuthService.refreshToken(sampleRefreshTokenParams)).rejects.toThrow(ApplicationError);
		await expect(oAuthService.refreshToken(sampleRefreshTokenParams)).rejects.toMatchObject({
			statusCode: 400,
			message: "Failed to delete refresh token",
		});
	});
});

