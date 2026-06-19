declare global {
	namespace NodeJS {
		interface ProcessEnv {
			MONGO_DB: string;
			REDIS_DB: string;
			PORT: string;
		}
	}
}

declare module "express-serve-static-core" {
    interface Request {
        user?: {
            id: string;
            scopes: string[];
        };
    }
}

//User Service
export interface UserPayload{
    name?:string,
    age?:number,
    email?:string,
    password?:string,
    gender?:string,
    avatar?:string
}
