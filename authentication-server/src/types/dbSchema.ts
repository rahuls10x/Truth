export interface Token{
    tokenString:string,
    clientId:string
    userId:string
    scopes:string[]
    expiresAt:Date
    isActive:boolean
}

export interface User{
    _id?:string;
	userId:string;
	name:string;
	email:string;
    age?:number;
    gender?:'Female' | 'Male' | 'Prefer not to say';
	password:string;
	isVerified:boolean;
}

export interface Organization{
    _id?:string;
	orgId:string;
	organizationName:string;
	email:string;
	domain:string;
	userName:string;
	password:string;
	isVerified:boolean;
	
}

export interface Session{
    _id?:string;
	sessionId:string;
	entityId:string;
    type:"user" | "organization";
	email:string;
	isRevoked:boolean;
	createdAt:Date;
	expiresAt:Date;
	ip:string;
	hardware:object
}

export interface Client{
    clientName:string;
    clientId:string;
    orgId:string;
    clientSecret:string;
    createdAt:Date;
    redirectUri:string;
    responseType:"code";
    scopes:string[]
}

export interface UserConsent{
    _id?:string;
    userId:string;
    clientId:string;
    createdAt:Date;
    updatedAt:Date;
    consent: boolean;
    isRevoked:boolean;
    scopes:string[]
}

export interface AuthenticationCode{
    code: string,
    clientId: string,
    userId: string,
    codeChallenge: string,
    challengeMethod: "S256",
    scopes:string[]
}