import type { EntityType } from "@/types";

export const APP_ROUTES = {
	root: "/",
	consent: "/consent",
	emailVerification: "/verify-email",
	user: {
		login: "/user/login",
		signup: "/user/signup",
		portal: "/user/portal"
	},
	organization: {
		login: "/org/login",
		signup: "/org/signup",
		portal: "/org/portal",
		clients: "/org/portal/clients",
	},
};

export const API_ROUTES = {
	whoAmI: "/whoAmI",
	logout: "/logout",
	consent: "/consent",
	verifyEmail: "/verify-email",
	authorize: "/authorize",
	user:{
		login: "/user/login",
		signup: "/user/signup",
		profile: "/user/profile",
	},
	organization: {
		login: "/org/login",
		signup: "/org/signup",
		clients: "/org/clients",
	},
};

export function getPortalRoute(entityType: EntityType): string {
	return entityType === "user" ? APP_ROUTES.user.portal : APP_ROUTES.organization.portal;
}

export function getLoginRoute(entityType: EntityType): string {
	return entityType === "user" ? APP_ROUTES.user.login : APP_ROUTES.organization.login;
}
