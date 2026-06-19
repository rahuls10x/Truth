import z from "zod";

/**
 * Validation Schema
 * 
 * @remarks
 * This schema is used to validate the input data in Validation middleware
 */
export const validationSchema = {
	name: z.string({ error: "Name must be a string" }).min(2, "Invalid Name."),
	email: z.email("Invalid email address."),
	password: z.string({ error: "Password must be a string" }).regex(/^(?=.*\d)(?=.*[A-Z])(?=.*[a-z])(?=.*[^\w\d\s:]).{8,32}$/, "Invalid Password."),
	organizationName: z.string({ error: "Organization Name must be a string" }).min(2, "Invalid Organization Name."),
	domain: z.string({ error: "Domain must be a string" }).regex(/^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}\.[a-zA-Z]{2,}$/, "Invalid domain."),
	age: z.number({ error: "Age must be a number" }).min(13, "Invalid Age.").max(120, "Invalid Age."),
	gender: z.enum(["Female", "Male", "Other"], { error: "Invalid Gender." }),
	boolean: z.boolean({ error: "Input must be a boolean" }),
	otp: z.number({ error: "Otp must be a number" }).min(100000, "Invalid Otp.").max(999999, "Invalid Otp."),
	date: z.coerce.date({ error: "Input must be a date" }),
	client_id: z.string({ error: "Client Id must be a string" }).startsWith("client_"),
	client_secret: z.string({ error: "Client Secret must be a string" }).startsWith("secret_"),
	refresh_token: z.string({ error: "Refresh Token must be a string" }).startsWith("rt_"),
	authorization_code: z.string({ error: "Authorization Code must be a string" }).startsWith("auth_"),
	redirect_uri: z.url({ error: "Redirect URI must be a url" }),
	state: z.string({ error: "State must be a string" }),
	challenge_method: z.enum(["S256"], { error: "Invalid Challenge Method." }),
	code_challenge: z.string({ error: "Code Challenge must be a string" }),
	response_type: z.enum(["code"], { error: "Invalid Response Type." }),
	scopes: z.array(z.enum(["name", "email", "age", "gender", "dob", "avatar"], { error: "Invalid Scope." })),
	authCode: z.string({ error: "Auth Code must be a string" }).startsWith("auth_"),
	code_verifier: z.string({ error: "Code Verifier must be a string" }).min(43, "Invalid Code Verifier.").max(128, "Invalid Code Verifier."),
};

export type Field = keyof typeof validationSchema;