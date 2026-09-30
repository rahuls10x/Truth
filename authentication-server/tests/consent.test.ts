import { describe, it, expect, vi, beforeEach } from "vitest";
import OAuthService from "../src/services/OAuthService.js";
import ApplicationError from "../src/utils/ApplicationError.js";
import type { ConsentQuery } from "../src/types/index.js";

describe("OAuth /consent - Success Flows", () => {
	let clientRepositoryMock: any;
	let tokenRepositoryMock: any;
	let consentRepositoryMock: any;
	let oAuthService: OAuthService;

	const sampleConsent: ConsentQuery = {
		userId: "user_12345678901234567890123456789012",
		clientId: "client_12345678901234567890123456789012",
		consent: true,
		scopes: ["name", "email"],
	};

	beforeEach(() => {
		clientRepositoryMock = {
			findByClientId: vi.fn(),
		};
		tokenRepositoryMock = {
			cacheAuthorizationCode: vi.fn(),
		};
		consentRepositoryMock = {
			getWaiverByUserIdAndClientId: vi.fn(),
			createUserConsent: vi.fn(),
			updateWaiverByUserIdAndClientId: vi.fn(),
		};
		oAuthService = new OAuthService(clientRepositoryMock, tokenRepositoryMock, consentRepositoryMock);
	});

	it("Consent made", async () => {
		clientRepositoryMock.findByClientId.mockResolvedValue({
			clientId: sampleConsent.clientId,
			clientName: "Test App",
		});
		consentRepositoryMock.getWaiverByUserIdAndClientId.mockResolvedValue(null);
		consentRepositoryMock.createUserConsent.mockResolvedValue(true);

		await expect(oAuthService.consent(sampleConsent)).resolves.toBeUndefined();

		expect(consentRepositoryMock.createUserConsent).toHaveBeenCalledWith(
			expect.objectContaining({
				userId: sampleConsent.userId,
				clientId: sampleConsent.clientId,
				consent: true,
				scopes: ["name", "email"],
				isRevoked: false,
			}),
		);
	});

	it("Consent updated", async () => {
		clientRepositoryMock.findByClientId.mockResolvedValue({
			clientId: sampleConsent.clientId,
			clientName: "Test App",
		});
		consentRepositoryMock.getWaiverByUserIdAndClientId.mockResolvedValue({
			userId: sampleConsent.userId,
			clientId: sampleConsent.clientId,
			consent: true,
			scopes: ["name"],
			isRevoked: false,
		});
		consentRepositoryMock.updateWaiverByUserIdAndClientId.mockResolvedValue(true);

		await expect(oAuthService.consent(sampleConsent)).resolves.toBeUndefined();

		expect(consentRepositoryMock.updateWaiverByUserIdAndClientId).toHaveBeenCalledWith(
			sampleConsent.userId,
			sampleConsent.clientId,
			expect.objectContaining({
				consent: true,
				scopes: ["name", "email"],
				isRevoked: false,
			}),
		);
	});
});

describe("OAuth /consent - Error States", () => {
	let clientRepositoryMock: any;
	let tokenRepositoryMock: any;
	let consentRepositoryMock: any;
	let oAuthService: OAuthService;

	const sampleConsent: ConsentQuery = {
		userId: "user_12345678901234567890123456789012",
		clientId: "client_12345678901234567890123456789012",
		consent: true,
		scopes: ["name", "email"],
	};

	beforeEach(() => {
		clientRepositoryMock = {
			findByClientId: vi.fn(),
		};
		tokenRepositoryMock = {
			cacheAuthorizationCode: vi.fn(),
		};
		consentRepositoryMock = {
			getWaiverByUserIdAndClientId: vi.fn(),
			createUserConsent: vi.fn(),
			updateWaiverByUserIdAndClientId: vi.fn(),
		};
		oAuthService = new OAuthService(clientRepositoryMock, tokenRepositoryMock, consentRepositoryMock);
	});

	it("Client not found", async () => {
		clientRepositoryMock.findByClientId.mockResolvedValue(null);

		await expect(oAuthService.consent(sampleConsent)).rejects.toThrow(ApplicationError);
		await expect(oAuthService.consent(sampleConsent)).rejects.toMatchObject({
			statusCode: 400,
			message: "Client not found",
		});
	});

	it("Failed to create consent", async () => {
		clientRepositoryMock.findByClientId.mockResolvedValue({
			clientId: sampleConsent.clientId,
			clientName: "Test App",
		});
		consentRepositoryMock.getWaiverByUserIdAndClientId.mockResolvedValue(null);
		consentRepositoryMock.createUserConsent.mockResolvedValue(false);

		await expect(oAuthService.consent(sampleConsent)).rejects.toThrow(ApplicationError);
		await expect(oAuthService.consent(sampleConsent)).rejects.toMatchObject({
			statusCode: 500,
			message: "Failed to create user consent",
		});
	});

	it("Failed to update consent", async () => {
		clientRepositoryMock.findByClientId.mockResolvedValue({
			clientId: sampleConsent.clientId,
			clientName: "Test App",
		});
		consentRepositoryMock.getWaiverByUserIdAndClientId.mockResolvedValue({
			userId: sampleConsent.userId,
			clientId: sampleConsent.clientId,
			consent: true,
			scopes: ["name"],
			isRevoked: false,
		});
		consentRepositoryMock.updateWaiverByUserIdAndClientId.mockResolvedValue(false);

		await expect(oAuthService.consent(sampleConsent)).rejects.toThrow(ApplicationError);
		await expect(oAuthService.consent(sampleConsent)).rejects.toMatchObject({
			statusCode: 500,
			message: "Failed to update user consent",
		});
	});
});