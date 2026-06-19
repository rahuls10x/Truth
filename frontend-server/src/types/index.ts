export type EntityType = "user" | "organization";

export interface AuthenticatedEntity {
	name: string;
	email: string;
}

export interface Identity extends AuthenticatedEntity {
	type: EntityType;
}

export interface Client {
	clientName: string;
	clientId: string;
	clientSecret: string;
	createdAt: string;
	redirectUri: string;
	responseType: "code";
	scopes: string[];
}
