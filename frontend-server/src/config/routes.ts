import type { EntityType } from "@/types";

export const APP_ROUTES = {
	root: "/",
	consent: "/consent",
	emailVerification: "/verify-email/:magicToken",
	resetPassword: "/reset-password/:magicToken",
	user: {
		login: "/user/login",
		signup: "/user/signup",
		forgotPassword: "/user/forgot-password",
		portal: "/user/portal",
		session: "/user/portal/session",
	},
	organization: {
		login: "/org/login",
		signup: "/org/signup",
		forgotPassword: "/org/forgot-password",
		portal: "/org/portal",
		clients: "/org/portal/clients",
		session: "/org/portal/session",
	},
};

export const API_ROUTES = {
	whoAmI: "/whoAmI",
	logout: "/logout",
	consent: "/consent",
	verifyEmail: "/verifyEmail",
	resetPassword: "/resetPassword",
	authorize: "/authorize",
	session: "/sessions",
	revokeSession:"/revokeSession",
	revokeAllSessions:"/revokeAllSessions",
	user:{
		login: "/user/login",
		signup: "/user/signup",
		profile: "/user/profile",
		forgotPassword: "/user/forgotPassword"
	},
	organization: {
		login: "/org/login",
		signup: "/org/signup",
		clients: "/org/clients",
		forgotPassword: "/org/forgotPassword"
	},
};

export function getPortalRoute(entityType: EntityType): string {
	return entityType === "user" ? APP_ROUTES.user.portal : APP_ROUTES.organization.portal;
}

export function getLoginRoute(entityType: EntityType): string {
	return entityType === "user" ? APP_ROUTES.user.login : APP_ROUTES.organization.login;
}
