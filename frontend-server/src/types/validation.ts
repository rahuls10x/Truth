import z, { email } from "zod";

export const SignupSchema = z
	.object({
		name: z.string({ message: "Name should be a Valid string" }).min(2, "Name should be at least 2 characters long"),
		email: z.email({ message: "Enter a valid email address " }),
		password: z
			.string({ message: "Password should be a valid string" })
			.regex(
				/^(?=.*\d)(?=.*[A-Z])(?=.*[a-z])(?=.*[^\w\d\s:]).{8,32}$/,
				"Password should be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one digit, and one special character",
			),
		confirmPassword: z.string({ message: "Password should be a valid string" }).min(8, "Password should be at least 8 characters long"),
	})
	.refine(data => data.password === data.confirmPassword, { message: "Passwords do not match", path: ["confirmPassword"] });

export const OrganizationSignupSchema = z
	.object({
		userName: z.string({ message: "Name should be a Valid string" }).min(2, "Name should be at least 2 characters long"),
		organizationName: z.string({ error: "Organization Name must be a string" }).min(2, "Invalid Organization Name."),
		domain: z.string({ error: "Domain must be a string" }).regex(/^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}\.[a-zA-Z]{2,}$/, "Invalid domain."),
		email: z.email({ message: "Enter a valid email address " }),
		password: z
			.string({ message: "Password should be a valid string" })
			.regex(
				/^(?=.*\d)(?=.*[A-Z])(?=.*[a-z])(?=.*[^\w\d\s:]).{8,32}$/,
				"Password should be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one digit, and one special character",
			),
		confirmPassword: z.string({ message: "Password should be a valid string" }).min(8, "Password should be at least 8 characters long"),
	})
	.refine(data => data.password === data.confirmPassword, { message: "Passwords do not match", path: ["confirmPassword"] });

export const LoginSchema = z.object({
	email: z.email({ message: "Enter a valid email address" }),
	password: z.string({ message: "Password should be a valid string" }).min(8, "Password should be at least 8 characters long"),
});

export const ForgotPasswordSchema = z.object({
	email: z.email({ message: "Enter a valid email address" }),
});

export const ResetPasswordSchema = z
	.object({
		password: z
			.string({ message: "Password should be a valid string" })
			.regex(
				/^(?=.*\d)(?=.*[A-Z])(?=.*[a-z])(?=.*[^\w\d\s:]).{8,32}$/,
				"Password should be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one digit, and one special character",
			),
		confirmPassword: z.string({ message: "Password should be a valid string" }).min(8, "Password should be at least 8 characters long"),
	})
	.refine(data => data.password === data.confirmPassword, { message: "Passwords do not match", path: ["confirmPassword"] });

export const ProfileSchema = z.object({
	name: z.string({ message: "Name must be a string" }).min(2, "Invalid Name."),
	email: z.email("Invalid email address.").trim(),
	age: z.coerce.number<number>({ message: "Age must be a number" }).min(13, "Invalid Age").max(120, "Invalid Age."),
	gender: z.enum(["Female", "Male", "Prefer not to say"], { message: "Invalid Gender." }),
});

export const CreateClientSchema = z.object({
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

export type CreateClientSchema = z.infer<typeof CreateClientSchema>;
export type SignupSchema = z.infer<typeof SignupSchema>;
export type OrganizationSignupSchema = z.infer<typeof OrganizationSignupSchema>;
export type LoginSchema = z.infer<typeof LoginSchema>;
export type ProfileSchema = z.infer<typeof ProfileSchema>;
export type ResetPasswordSchema = z.infer<typeof ResetPasswordSchema>;
export type ForgotPasswordSchema = z.infer<typeof ForgotPasswordSchema>;
