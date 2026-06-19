import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { APP_ROUTES } from "@/config/routes";
import { useAuth } from "@/contexts/AuthContext";
import type { EntityType } from "@/types";
import {
	LoginSchema,
	OrganizationSignupSchema,
	SignupSchema,
	type LoginSchema as LoginValues,
	type OrganizationSignupSchema as OrganizationSignupValues,
	type SignupSchema as SignupValues,
} from "@/types/validation";
import { zodResolver } from "@hookform/resolvers/zod";
import { EyeIcon, EyeOffIcon, LoaderCircleIcon } from "lucide-react";
import { useState, type ComponentProps, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";

interface AuthCardProps {
	title: string;
	description: string;
	children: ReactNode;
	footer: ReactNode;
}

function AuthCard({ title, description, children, footer }: AuthCardProps) {
	return (
		<main className="flex min-h-dvh items-center justify-center p-4">
			<Card className="w-full max-w-md">
				<CardHeader className="text-center">
					<CardTitle className="text-xl">{title}</CardTitle>
					<CardDescription>{description}</CardDescription>
				</CardHeader>
				<CardContent>{children}</CardContent>
				<CardFooter className="justify-center text-sm text-muted-foreground">{footer}</CardFooter>
			</Card>
		</main>
	);
}

interface PasswordFieldProps extends Omit<ComponentProps<typeof Input>, "type"> {
	label: string;
	error?: string;
}

function PasswordField({ id, label, error, ...props }: PasswordFieldProps) {
	const [isVisible, setIsVisible] = useState(false);

	return (
		<Field data-invalid={Boolean(error)}>
			<FieldLabel htmlFor={id}>{label}</FieldLabel>
			<div className="relative">
				<Input id={id} type={isVisible ? "text" : "password"} aria-invalid={Boolean(error)} className="pr-10" {...props} />
				<Button
					type="button"
					variant="ghost"
					size="icon-sm"
					className="absolute right-1 top-1/2 -translate-y-1/2"
					onClick={() => setIsVisible(current => !current)}
					aria-label={isVisible ? "Hide password" : "Show password"}
				>
					{isVisible ? <EyeOffIcon /> : <EyeIcon />}
				</Button>
			</div>
			<FieldError>{error}</FieldError>
		</Field>
	);
}

function SubmitButton({ isSubmitting, label }: { isSubmitting: boolean; label: string }) {
	return (
		<Button type="submit" disabled={isSubmitting}>
			{isSubmitting && <LoaderCircleIcon className="animate-spin" />}
			{isSubmitting ? "Please wait" : label}
		</Button>
	);
}


function LoginPage({ entityType }: { entityType: EntityType }) {
	const auth = useAuth();
	const isUser = entityType === "user";
	const login = isUser ? auth.userLogin : auth.organizationLogin;
	const signupPath = isUser ? APP_ROUTES.user.signup : APP_ROUTES.organization.signup;
	const alternateLoginPath = isUser ? APP_ROUTES.organization.login : APP_ROUTES.user.login;
	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<LoginValues>({
		resolver: zodResolver(LoginSchema),
		defaultValues: { email: "", password: "" },
	});


	return (
		<AuthCard
			title={`${isUser ? "User" : "Organization"} login`}
			description="Enter your credentials to continue to the portal."
			footer={
				<span>
					Need an account? <Link className="font-medium text-foreground underline-offset-4 hover:underline" to={signupPath}>Sign up</Link>
				</span>
			}
		>
			<form onSubmit={handleSubmit(login)} noValidate>
				<FieldGroup>
					<Field data-invalid={Boolean(errors.email)}>
						<FieldLabel htmlFor={`${entityType}-login-email`}>Email</FieldLabel>
						<Input
							id={`${entityType}-login-email`}
							type="email"
							autoComplete="email"
							aria-invalid={Boolean(errors.email)}
							{...register("email")}
						/>
						<FieldError>{errors.email?.message}</FieldError>
					</Field>
					<PasswordField
						id={`${entityType}-login-password`}
						label="Password"
						autoComplete="current-password"
						error={errors.password?.message}
						{...register("password")}
					/>
					<SubmitButton isSubmitting={isSubmitting} label="Login" />
					<Button variant="ghost" asChild>
						<Link to={alternateLoginPath}>Use {isUser ? "organization" : "user"} login</Link>
					</Button>
				</FieldGroup>
			</form>
		</AuthCard>
	);
}

export function UserLoginPage() {
	return <LoginPage entityType="user" />;
}

export function OrganizationLoginPage() {
	return <LoginPage entityType="organization" />;
}

export function UserSignupPage() {
	const { userSignup } = useAuth();
	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<SignupValues>({
		resolver: zodResolver(SignupSchema),
		defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
	});

	return (
		<AuthCard
			title="Create a user account"
			description="Register your details to access the user portal."
			footer={<span>Already registered? <Link className="font-medium text-foreground underline-offset-4 hover:underline" to={APP_ROUTES.user.login}>Log in</Link></span>}
		>
			<form onSubmit={handleSubmit(userSignup)} noValidate>
				<FieldGroup>
					<Field data-invalid={Boolean(errors.name)}>
						<FieldLabel htmlFor="user-signup-name">Full name</FieldLabel>
						<Input id="user-signup-name" autoComplete="name" aria-invalid={Boolean(errors.name)} {...register("name")} />
						<FieldError>{errors.name?.message}</FieldError>
					</Field>
					<Field data-invalid={Boolean(errors.email)}>
						<FieldLabel htmlFor="user-signup-email">Email</FieldLabel>
						<Input id="user-signup-email" type="email" autoComplete="email" aria-invalid={Boolean(errors.email)} {...register("email")} />
						<FieldError>{errors.email?.message}</FieldError>
					</Field>
					<PasswordField id="user-signup-password" label="Password" autoComplete="new-password" error={errors.password?.message} {...register("password")} />
					<PasswordField id="user-signup-confirm-password" label="Confirm password" autoComplete="new-password" error={errors.confirmPassword?.message} {...register("confirmPassword")} />
					<SubmitButton isSubmitting={isSubmitting} label="Create account" />
				</FieldGroup>
			</form>
		</AuthCard>
	);
}

export function OrganizationSignupPage() {
	const { organizationSignup } = useAuth();
	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<OrganizationSignupValues>({
		resolver: zodResolver(OrganizationSignupSchema),
		defaultValues: { userName: "", organizationName: "", domain: "", email: "", password: "", confirmPassword: "" },
	});

	return (
		<AuthCard
			title="Create an organization"
			description="Register your organization and administrator account."
			footer={<span>Already registered? <Link className="font-medium text-foreground underline-offset-4 hover:underline" to={APP_ROUTES.organization.login}>Log in</Link></span>}
		>
			<form onSubmit={handleSubmit(organizationSignup)} noValidate>
				<FieldGroup>
					<Field data-invalid={Boolean(errors.userName)}>
						<FieldLabel htmlFor="organization-signup-name">Administrator name</FieldLabel>
						<Input id="organization-signup-name" autoComplete="name" aria-invalid={Boolean(errors.userName)} {...register("userName")} />
						<FieldError>{errors.userName?.message}</FieldError>
					</Field>
					<Field data-invalid={Boolean(errors.organizationName)}>
						<FieldLabel htmlFor="organization-name">Organization name</FieldLabel>
						<Input id="organization-name" autoComplete="organization" aria-invalid={Boolean(errors.organizationName)} {...register("organizationName")} />
						<FieldError>{errors.organizationName?.message}</FieldError>
					</Field>
					<Field data-invalid={Boolean(errors.domain)}>
						<FieldLabel htmlFor="organization-domain">Domain</FieldLabel>
						<Input id="organization-domain" placeholder="example.com" aria-invalid={Boolean(errors.domain)} {...register("domain")} />
						<FieldError>{errors.domain?.message}</FieldError>
					</Field>
					<Field data-invalid={Boolean(errors.email)}>
						<FieldLabel htmlFor="organization-signup-email">Administrator email</FieldLabel>
						<Input id="organization-signup-email" type="email" autoComplete="email" aria-invalid={Boolean(errors.email)} {...register("email")} />
						<FieldError>{errors.email?.message}</FieldError>
					</Field>
					<PasswordField id="organization-signup-password" label="Password" autoComplete="new-password" error={errors.password?.message} {...register("password")} />
					<PasswordField id="organization-signup-confirm-password" label="Confirm password" autoComplete="new-password" error={errors.confirmPassword?.message} {...register("confirmPassword")} />
					<SubmitButton isSubmitting={isSubmitting} label="Create organization" />
				</FieldGroup>
			</form>
		</AuthCard>
	);
}
