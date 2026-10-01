import { describe, it, expect, vi, beforeEach } from "vitest";
import TokenAuthMiddleware from "../src/middlewares/TokenAuthMiddleware.js";
import UserController from "../src/controllers/UserController.js";
import UserService from "../src/services/UserService.js";
import ApplicationError from "../src/utils/ApplicationError.js";
import type { Token, User } from "../src/types/dbSchema.js";

const sampleTokenString = "at_1234567890123456789012345678901234567890123456789012345678901234";
const sampleUserId = "user_12345678901234567890123456789012";

const sampleTokenRecord: Token = {
	tokenString: sampleTokenString,
	clientId: "client_12345678901234567890123456789012",
	userId: sampleUserId,
	scopes: ["name", "email", "age", "gender"],
	expiresAt: new Date(Date.now() + 3600 * 1000),
	isActive: true,
};

const sampleUserRecord: User = {
	userId: sampleUserId,
	name: "John Doe",
	email: "john@example.com",
	age: 28,
	gender: "Male",
	password: "hashed_password",
	isVerified: true,
};

describe("Resource Server GET /resource - Success Flows", () => {
	let tokenRepositoryMock: any;
	let userRepositoryMock: any;
	let userService: UserService;
	let tokenAuthMiddleware: TokenAuthMiddleware;
	let userController: UserController;

	beforeEach(() => {
		tokenRepositoryMock = {
			findActiveAccessToken: vi.fn(),
		};
		userRepositoryMock = {
			getUserById: vi.fn(),
		};

		userService = new UserService(userRepositoryMock);
		tokenAuthMiddleware = new TokenAuthMiddleware(tokenRepositoryMock);
		userController = new UserController(userService);
	});

	it("Successful resource grant with all requested scopes", async () => {
		tokenRepositoryMock.findActiveAccessToken.mockResolvedValue(sampleTokenRecord);
		userRepositoryMock.getUserById.mockResolvedValue(sampleUserRecord);

		const req: any = {
			headers: {
				authorization: `Bearer ${sampleTokenString}`,
			},
		};

		const jsonSpy = vi.fn();
		const statusSpy = vi.fn().mockReturnValue({ json: jsonSpy });
		const res: any = {
			status: statusSpy,
		};

		const nextSpy = vi.fn().mockImplementation(async () => {
			await userController.resource(req, res, vi.fn());
		});

		await tokenAuthMiddleware.verifyAccessToken(req, res, nextSpy);
		await Promise.resolve();

		expect(nextSpy).toHaveBeenCalled();
		expect(req.user).toEqual({
			id: sampleUserId,
			scopes: ["name", "email", "age", "gender"],
		});
		expect(statusSpy).toHaveBeenCalledWith(200);
		expect(jsonSpy).toHaveBeenCalledWith({
			success: true,
			message: "User resource has been fetched Successfully",
			data: {
				name: "John Doe",
				email: "john@example.com",
				age: 28,
				gender: "Male",
			},
		});
	});

	it("Successful resource grant with partial scopes", async () => {
		const partialTokenRecord: Token = {
			...sampleTokenRecord,
			scopes: ["name", "email"],
		};
		tokenRepositoryMock.findActiveAccessToken.mockResolvedValue(partialTokenRecord);
		userRepositoryMock.getUserById.mockResolvedValue(sampleUserRecord);

		const req: any = {
			headers: {
				authorization: `Bearer ${sampleTokenString}`,
			},
		};

		const jsonSpy = vi.fn();
		const statusSpy = vi.fn().mockReturnValue({ json: jsonSpy });
		const res: any = {
			status: statusSpy,
		};

		const nextSpy = vi.fn().mockImplementation(async () => {
			await userController.resource(req, res, vi.fn());
		});

		await tokenAuthMiddleware.verifyAccessToken(req, res, nextSpy);
		await Promise.resolve();

		expect(nextSpy).toHaveBeenCalled();
		expect(statusSpy).toHaveBeenCalledWith(200);
		expect(jsonSpy).toHaveBeenCalledWith({
			success: true,
			message: "User resource has been fetched Successfully",
			data: {
				name: "John Doe",
				email: "john@example.com",
			},
		});
	});
});

describe("Resource Server GET /resource - Error Flows", () => {
	let tokenRepositoryMock: any;
	let userRepositoryMock: any;
	let userService: UserService;
	let tokenAuthMiddleware: TokenAuthMiddleware;
	let userController: UserController;

	beforeEach(() => {
		tokenRepositoryMock = {
			findActiveAccessToken: vi.fn(),
		};
		userRepositoryMock = {
			getUserById: vi.fn(),
		};

		userService = new UserService(userRepositoryMock);
		tokenAuthMiddleware = new TokenAuthMiddleware(tokenRepositoryMock);
		userController = new UserController(userService);
	});

	describe("Malformed access token", () => {
		it("Missing authorization header", async () => {
			const req: any = {
				headers: {},
			};

			const jsonSpy = vi.fn();
			const statusSpy = vi.fn().mockReturnValue({ json: jsonSpy });
			const res: any = {
				status: statusSpy,
			};
			const nextSpy = vi.fn();

			await tokenAuthMiddleware.verifyAccessToken(req, res, nextSpy);

			expect(nextSpy).not.toHaveBeenCalled();
			expect(statusSpy).toHaveBeenCalledWith(401);
			expect(jsonSpy).toHaveBeenCalledWith({
				success: false,
				error: "Malformed access token",
			});
		});

		it("Authorization header without Bearer scheme", async () => {
			const req: any = {
				headers: {
					authorization: `Basic ${sampleTokenString}`,
				},
			};

			const jsonSpy = vi.fn();
			const statusSpy = vi.fn().mockReturnValue({ json: jsonSpy });
			const res: any = {
				status: statusSpy,
			};
			const nextSpy = vi.fn();

			await tokenAuthMiddleware.verifyAccessToken(req, res, nextSpy);

			expect(nextSpy).not.toHaveBeenCalled();
			expect(statusSpy).toHaveBeenCalledWith(401);
			expect(jsonSpy).toHaveBeenCalledWith({
				success: false,
				error: "Malformed access token",
			});
		});

		it("Authorization header with Bearer but missing token segment", async () => {
			const req: any = {
				headers: {
					authorization: "Bearer ",
				},
			};

			const jsonSpy = vi.fn();
			const statusSpy = vi.fn().mockReturnValue({ json: jsonSpy });
			const res: any = {
				status: statusSpy,
			};
			const nextSpy = vi.fn();

			await tokenAuthMiddleware.verifyAccessToken(req, res, nextSpy);

			expect(nextSpy).not.toHaveBeenCalled();
			expect(statusSpy).toHaveBeenCalledWith(401);
			expect(jsonSpy).toHaveBeenCalledWith({
				success: false,
				error: "Malformed access token",
			});
		});
	});

	describe("Invalid access token", () => {
		it("Access token missing 'at_' prefix", async () => {
			const req: any = {
				headers: {
					authorization: "Bearer rt_12345678901234567890123456789012",
				},
			};

			const jsonSpy = vi.fn();
			const statusSpy = vi.fn().mockReturnValue({ json: jsonSpy });
			const res: any = {
				status: statusSpy,
			};
			const nextSpy = vi.fn();

			await tokenAuthMiddleware.verifyAccessToken(req, res, nextSpy);

			expect(nextSpy).not.toHaveBeenCalled();
			expect(statusSpy).toHaveBeenCalledWith(401);
			expect(jsonSpy).toHaveBeenCalledWith({
				success: false,
				error: "Invalid access token",
			});
		});

		it("Access token is not found in cache or DB / expired / inactive", async () => {
			tokenRepositoryMock.findActiveAccessToken.mockResolvedValue(null);

			const req: any = {
				headers: {
					authorization: `Bearer ${sampleTokenString}`,
				},
			};

			const jsonSpy = vi.fn();
			const statusSpy = vi.fn().mockReturnValue({ json: jsonSpy });
			const res: any = {
				status: statusSpy,
			};
			const nextSpy = vi.fn();

			await tokenAuthMiddleware.verifyAccessToken(req, res, nextSpy);

			expect(nextSpy).not.toHaveBeenCalled();
			expect(tokenRepositoryMock.findActiveAccessToken).toHaveBeenCalledWith(sampleTokenString);
			expect(statusSpy).toHaveBeenCalledWith(401);
			expect(jsonSpy).toHaveBeenCalledWith({
				success: false,
				error: "Access token is invalid or expired",
			});
		});
	});

	describe("User does not exist", () => {
		it("Valid active token but user record does not exist in repository", async () => {
			const tokenRecord: Token = {
				tokenString: sampleTokenString,
				clientId: "client_12345678901234567890123456789012",
				userId: sampleUserId,
				scopes: ["name", "email"],
				expiresAt: new Date(Date.now() + 3600 * 1000),
				isActive: true,
			};

			tokenRepositoryMock.findActiveAccessToken.mockResolvedValue(tokenRecord);
			userRepositoryMock.getUserById.mockResolvedValue(null);

			const req: any = {
				headers: {
					authorization: `Bearer ${sampleTokenString}`,
				},
			};

			const jsonSpy = vi.fn();
			const statusSpy = vi.fn().mockReturnValue({ json: jsonSpy });
			const res: any = {
				status: statusSpy,
			};

			const nextSpy = vi.fn().mockImplementation(async () => {
				await userController.resource(req, res, vi.fn());
			});

			await tokenAuthMiddleware.verifyAccessToken(req, res, nextSpy);
			await Promise.resolve();

			expect(nextSpy).toHaveBeenCalled();
			expect(userRepositoryMock.getUserById).toHaveBeenCalledWith(sampleUserId);
			expect(statusSpy).toHaveBeenCalledWith(400);
			expect(jsonSpy).toHaveBeenCalledWith({
				success: false,
				error: "User doesnt exist",
			});
		});

		it("Direct UserService call throws ApplicationError when user does not exist", async () => {
			userRepositoryMock.getUserById.mockResolvedValue(null);

			await expect(
				userService.getResource({ id: "user_nonexistent", scopes: ["name", "email"] }),
			).rejects.toThrow(ApplicationError);

			await expect(
				userService.getResource({ id: "user_nonexistent", scopes: ["name", "email"] }),
			).rejects.toMatchObject({
				statusCode: 400,
				message: "User doesnt exist",
			});
		});
	});
});

