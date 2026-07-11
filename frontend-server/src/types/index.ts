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

interface Hardware {
	client: {
		name?: string;
		version?: string;
		type?: string;
	};
	os: {
		name?: string;
		version?: string;
	};
	device: {
		type?: string;
		vendor?: string;
		model?: string;
	};
}

export interface Session {
	_id: string;
	hardware: Hardware;
	createdAt: Date;
	expiresAt: Date;
	ip: string;
	isCurrent: boolean;
}
