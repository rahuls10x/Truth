import z from "zod";

/**
 * Reusable Validation Schemas
 */
const name = z.string({ error: "Name must be a string" }).min(2, "Invalid Name.");
const email = z.email("Invalid email address.");
const password = z
	.string({ error: "Password must be a string" })
	.regex(
		/^(?=.*\d)(?=.*[A-Z])(?=.*[a-z])(?=.*[^\w\d\s:]).{8,32}$/,
		"Password should be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one digit, and one special character",
	);
const magicToken = z.string({ error: "Magic Token must be a string" }).startsWith("mt_");
const clientId = z.string({ error: "Client Id must be a string" }).startsWith("client_");
const clientSecret = z.string({ error: "Client Secret must be a string" }).startsWith("secret_");

export const UserSignupInput = z.object({
	name: z.string({ error: "Name must be a string" }).min(2, "Invalid Name."),
	email: z.email("Invalid email address.").toLowerCase().trim(),
	password
});

export type UserSignupRequest = z.infer<typeof UserSignupInput>;

export const LoginInput = z.object({
	email: email.toLowerCase().trim(),
	password
});

export type LoginRequest = z.infer<typeof LoginInput>;

export const OrgSignupInput = z.object({
	userName:name,
	email,
	password,
	organizationName: z.string({ error: "Organization Name must be a string" }).min(2, "Invalid Organization Name."),
	domain: z.string({ error: "Domain must be a string" }).regex(/^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}\.[a-zA-Z]{2,}$/, "Invalid domain."),
});

export type OrgSignupRequest = z.infer<typeof OrgSignupInput>;

export const ForgotPasswordInput = z.object({
	email: email.toLowerCase().trim(),
});

export type ForgotPasswordRequest = z.infer<typeof ForgotPasswordInput>;

export const ResetPasswordInput = z.object({
	password,
	magicToken,
});

export type ResetPasswordRequest = z.infer<typeof ResetPasswordInput>;

export const VerifyEmailInput = z.object({
	magicToken,
});

export type VerifyEmailRequest = z.infer<typeof VerifyEmailInput>;

export const UpdateProfileInput = z.object({
	name,
	age: z.number({ error: "Age must be a number" }).min(13, "Invalid Age.").max(120, "Invalid Age."),
	gender: z.enum(["Female", "Male", "Prefer not to say"], { error: "Invalid Gender." }),
})

export type UpdateProfileRequest = z.infer<typeof UpdateProfileInput>;

export const CreateClientInput = z.object({
	clientName: z.string({ message: "Name must be a string" }).min(2, "Invalid Name."),
	responseType: z.enum(["code"], { message: "Invalid Response type." }),
	scopes: z
		.array(z.string())
		.min(1, "Select at least one scope")
		.refine(scopes => scopes.every(scope => ["name", "email", "age", "gender", "dob", "avatar"].includes(scope)), {
			message: "One or more scopes are invalid",
		}),
	redirectUri: z.url({ error: "Redirect URI must be a url" }),
});

export type CreateClientRequest = z.infer<typeof CreateClientInput>;

export const ConsentInput = z.object({
	client_id: clientId,
	scopes: z.array(z.enum(["name", "email", "age", "gender", "dob", "avatar"], { error: "Invalid Scope." })),
	consent:z.boolean({ error: "Consent must be a boolean" })
});

export type ConsentRequest = z.infer<typeof ConsentInput>;

export const AuthorizeInput = z.object({
	client_id:clientId,
	redirect_uri:z.url({ error: "Redirect URI must be a url" }),
	response_type:z.enum(["code"],{ error: "Invalid Response Type." }),
	state:z.string({ error: "State must be a string" }),
	challenge_method:z.enum(["S256"],{ error: "Invalid Challenge Method." }),
	scopes:z.string().trim().transform((s)=> s.split(" ")).pipe(z.array(z.enum(["name", "email", "age", "gender", "dob", "avatar"], { error: "Invalid Scope." }))),
	code_challenge:z.string({ error: "Code Challenge must be a string" }).min(43, "Invalid Code Challenge.").max(128, "Invalid Code Challenge."),
});

export type AuthorizeRequest = z.infer<typeof AuthorizeInput>;

export const TokenizeInput = z.object({
	client_id:clientId,
	client_secret:clientSecret,
	code:z.string({ error: "Code must be a string" }).startsWith("auth_"),
	code_verifier:z.string({ error: "Code Verifier must be a string" }).min(43, "Invalid Code Verifier.").max(128, "Invalid Code Verifier."),
});

export type TokenizeRequest = z.infer<typeof TokenizeInput>;

export const RefreshTokenInput = z.object({
	refresh_token:z.string({ error: "Refresh Token must be a string" }).startsWith("rt_"),
	client_id:clientId,
	client_secret:clientSecret,
});

export type RefreshTokenRequest = z.infer<typeof RefreshTokenInput>;