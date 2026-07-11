import "express-serve-static-core";
import type { Hardware } from "./dbSchema.js";

declare global {
	namespace NodeJS {
		interface ProcessEnv {
			ORIGIN_URL: string;
			MONGO_DB: string;
			REDIS_DB: string;
			PORT: string;
		}
	}
}

declare module "express-serve-static-core" {
	export interface Request {
		user?: {
			id: string;
			email: string;
		};
		organization?: {
			id: string;
			email: string;
		};
		sessionId?: string;
		authorizationRequest?: {
			clientId: string;
			redirectUri: string;
			responseType: "code";
			state: string;
			challengeMethod: "S256";
			scope: string[];
			codeChallenge: string;
		};
		tokenizationRequest?: {
			clientId: string;
			clientSecret: string;
			code: string;
			codeVerifier: string;
		};
		refreshTokenRequest?: {
			refreshToken: string;
			clientId: string;
			clientSecret: string;
		};
	}
}

// UserService
export interface ProfilePayload {
	name: string;
	email: string;
	age: number;
	gender: "Female" | "Male" | "Prefer not to say";
}

export interface UpdateProfileBody {
	userId: string;
	name: string;
	age: number;
	gender: "Female" | "Male" | "Prefer not to say";
}

//Organization Service

export interface ClientPayload {
	clientId: string;
	clientName: string;
	clientSecret: string;
	createdAt: Date;
	redirectUri: string;
	responseType: "code";
	scopes: string[];
}

export interface CreateClientParams {
	clientName: string;
	redirectUri: string;
	scopes: string[];
	responseType: "code";
}

//OAuth Service
export interface ConsentQuery {
	userId: string;
	clientId: string;
	consent: boolean;
	scopes: string[];
}

export interface AuthorizationQuery {
	clientId: string;
	redirectUri: string;
	responseType: "code";
	state: string;
	challengeMethod: "S256";
	scope: string[];
	codeChallenge: string;
	userId: string;
}

export interface TokenizationBody {
	clientId: string;
	clientSecret: string;
	code: string;
	codeVerifier: string;
}

export interface TokenPayload {
	access_token: string;
	token_type: "Bearer";
	expires_in: number;
	refresh_token: string;
	scopes: string[];
}

export interface RefreshTokenParams {
	refreshToken: string;
	clientId: string;
	clientSecret: string;
}

// Auth Service
export interface LoginPayload {
	name: string;
	email: string;
	sessionId: string;
}

export interface IdentityPayload {
	name: string;
	email: string;
	type: "user" | "organization";
}

export interface LinkPayload {
	entityType: "user" | "organization";
	entityId: string;
	action: string;
}

export interface SessionPayload {
	_id: string;
	hardware: Hardware;
	createdAt: Date;
	expiresAt: Date;
	ip: string;
	isCurrent: boolean;
}
