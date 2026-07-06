import Logo from "@/assets/Logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
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
import { Link, useNavigate, useSearchParams } from "react-router-dom";

// Smaller shared components

interface PasswordFieldProps extends Omit<ComponentProps<typeof Input>, "type"> {
	label: string;
	error?: string;
}

function PasswordField({ id, label, error, ...props }: PasswordFieldProps) {
	const [isVisible, setIsVisible] = useState(false);

	return (
		<Field data-invalid={Boolean(error)}>
			<FieldLabel htmlFor={id}>{label}</FieldLabel>
			<InputGroup>
				<InputGroupInput
					id={id}
					type={isVisible ? "text" : "password"}
					aria-invalid={Boolean(error)}
					className="pr-10 outline-none focus-visible:ring-0"
					{...props}
				/>
				<InputGroupAddon
					align={"inline-end"}
					onClick={() => setIsVisible(current => !current)}
					aria-label={isVisible ? "Hide password" : "Show password"}
				>
					{isVisible ? <EyeOffIcon /> : <EyeIcon />}
				</InputGroupAddon>
			</InputGroup>
			<FieldError>{error}</FieldError>
		</Field>
	);
}

function SubmitButton({ isSubmitting, label }: { isSubmitting: boolean; label: string }) {
	return (
		<Button type="submit" disabled={isSubmitting} className="font-button font-semibold">
			{isSubmitting && <LoaderCircleIcon className="animate-spin" />}
			{isSubmitting ? "Please wait" : label}
		</Button>
	);
}

function Grow({ children }: { children?: ReactNode }) {
	return <div className="grow">{children}</div>;
}
//Main layout
interface AuthInterfaceProps {
	title: string;
	description: string;
	children: ReactNode;
	footer: ReactNode;
}

function AuthInterface({ title, description, children, footer }: AuthInterfaceProps) {
	return (
		<main className="flex bg-[url('/backgrounds/authPageBackground.png')] bg-no-repeat bg-cover h-dvh items-center justify-center p-4">
			<div className="max-w-md w-14/15 md:max-w-none md:h-9/10 h-14/15 md:max-h-none outline-1 bg-background overflow-y-hidden rounded-2xl flex p-2 gap-2">
				<div className="bg-[url('/backgrounds/authPageBackground.png')] w-1/2 bg-no-repeat bg-fixed bg-cover rounded-2xl p-8 md:flex md:flex-col hidden ">
					<h1 className="text-xl font-heading font-semibold text-muted">── Secure Identity Provider</h1>
					<Grow />
					<p className="font-text text-background">
						<span className="xl:text-6xl lg:text-4xl md:text-3xl font-bold block xl:w-9/10 lg:w-8/10">
							We value your <span className="bg-clip-text bg-linear-to-r from-background to-primary/80  text-transparent">Privacy</span>{" "}
							above all
						</span>{" "}
						<br />
						<br />
						<span className="xl:text-xl lg:text-base md:text-xs">No unauthorized data ever leaves our ecosystem.</span>
					</p>
					<p className="font-text italic text-background xl:text-base lg:text-sm md:text-xs">
						It's all Open-Source -{" "}
						<a href="https://github.com/rahuls10x/Truth" className="underline font-link">
							Github
						</a>
					</p>
				</div>
				<div className="md:w-1/2 w-full h-full flex flex-col items-center overflow-hidden">
					<div className="flex min-h-8 mt-4 gap-1.5 bg-clip-text bg-linear-to-r from-primary to-primary/70 text-transparent">
						<span className="text-lg font-heading font-extrabold">Truth</span>
						<Logo className="w-6 h-6 text-primary mt-1" />
					</div>
					<Grow />
					<Card className="w-full max-w-sm md:max-w-md min-h-94 bg-transparent ring-0 overflow-y-scroll scrollbar-none">
						<CardHeader>
							<CardTitle className="font-heading font-semibold text-center text-2xl">{title}</CardTitle>
							<CardDescription className="text-center md:text-lg text-base font-subheading font-light">{description}</CardDescription>
						</CardHeader>
						<CardContent className="bg-transparent lg:w-4/5 h-full lg:m-auto  m-1.5">{children}</CardContent>
					</Card>
					<Grow />
					<div className="mb-4 min-h-10 p-2">{footer}</div>
				</div>
			</div>
		</main>
	);
}

//Components
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
		<AuthInterface
			title={`Welcome back, ${isUser ? "User" : "Organization"}`}
			description="Please enter your credentials"
			footer={
				<span>
					Need an account?{" "}
					<Link className="font-medium text-foreground underline-offset-4 hover:underline" to={signupPath}>
						Sign up
					</Link>
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
					<Button variant={"ghost"} asChild>
						<Link to={alternateLoginPath}>{isUser ? "Organization" : "User"} Login</Link>
					</Button>
				</FieldGroup>
			</form>
		</AuthInterface>
	);
}

//Pages
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
		<AuthInterface
			title="Create a user account"
			description="Register your details below"
			footer={
				<span>
					Already registered?{" "}
					<Link className="font-medium text-foreground underline-offset-4 hover:underline" to={APP_ROUTES.user.login}>
						Log in
					</Link>
				</span>
			}
		>
			<form onSubmit={handleSubmit(userSignup)} noValidate>
				<FieldGroup>
					<Field data-invalid={Boolean(errors.name)}>
						<FieldLabel htmlFor="name">Full name</FieldLabel>
						<Input id="name" autoComplete="name" aria-invalid={Boolean(errors.name)} {...register("name")} />
						<FieldError>{errors.name?.message}</FieldError>
					</Field>
					<Field data-invalid={Boolean(errors.email)}>
						<FieldLabel htmlFor="email">Email</FieldLabel>
						<Input id="email" type="email" autoComplete="email" aria-invalid={Boolean(errors.email)} {...register("email")} />
						<FieldError>{errors.email?.message}</FieldError>
					</Field>
					<PasswordField
						id="password"
						label="Password"
						autoComplete="new-password"
						error={errors.password?.message}
						{...register("password")}
					/>
					<Field>
						<FieldLabel htmlFor="confirm-password">Confirm password</FieldLabel>
						<Input id="confirm-password" type="password" {...register("confirmPassword")} />
						<FieldError>{errors.confirmPassword?.message}</FieldError>
					</Field>
					<SubmitButton isSubmitting={isSubmitting} label="Create account" />
				</FieldGroup>
			</form>
		</AuthInterface>
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
		<AuthInterface
			title="Create an organization"
			description="Register your details below"
			footer={
				<span>
					Already registered?{" "}
					<Link className="font-medium text-foreground underline-offset-4 hover:underline" to={APP_ROUTES.organization.login}>
						Log in
					</Link>
				</span>
			}
		>
			<form onSubmit={handleSubmit(organizationSignup)} noValidate>
				<FieldGroup>
					<Field data-invalid={Boolean(errors.userName)}>
						<FieldLabel htmlFor="name">Administrator name</FieldLabel>
						<Input id="name" autoComplete="name" aria-invalid={Boolean(errors.userName)} {...register("userName")} />
						<FieldError>{errors.userName?.message}</FieldError>
					</Field>
					<Field data-invalid={Boolean(errors.organizationName)}>
						<FieldLabel htmlFor="organization-name">Organization name</FieldLabel>
						<Input
							id="organization-name"
							autoComplete="organization"
							aria-invalid={Boolean(errors.organizationName)}
							{...register("organizationName")}
						/>
						<FieldError>{errors.organizationName?.message}</FieldError>
					</Field>
					<Field data-invalid={Boolean(errors.domain)}>
						<FieldLabel htmlFor="organization-domain">Domain</FieldLabel>
						<Input id="organization-domain" placeholder="example.com" aria-invalid={Boolean(errors.domain)} {...register("domain")} />
						<FieldError>{errors.domain?.message}</FieldError>
					</Field>
					<Field data-invalid={Boolean(errors.email)}>
						<FieldLabel htmlFor="email">Administrator email</FieldLabel>
						<Input id="email" type="email" autoComplete="email" aria-invalid={Boolean(errors.email)} {...register("email")} />
						<FieldError>{errors.email?.message}</FieldError>
					</Field>
					<PasswordField
						id="password"
						label="Password"
						autoComplete="new-password"
						error={errors.password?.message}
						{...register("password")}
					/>
					<Field>
						<FieldLabel htmlFor="confirm-password">Confirm password</FieldLabel>
						<Input id="confirm-password" type="password" {...register("confirmPassword")} />
						<FieldError>{errors.confirmPassword?.message}</FieldError>
					</Field>

					<SubmitButton isSubmitting={isSubmitting} label="Create organization" />
				</FieldGroup>
			</form>
		</AuthInterface>
	);
}

export function ConsentPage() {
	const [searchParams] = useSearchParams();
	const clientId = searchParams.get("client_id");
	const redirectUri = searchParams.get("redirect_uri");
	const responseType = searchParams.get("response_type");
	const challengeMethod = searchParams.get("challenge_method");
	const code_challenge = searchParams.get("challenge_method");
	const scopes = (searchParams.get("scopes") ?? "").trim().split(/\s+/).filter(Boolean);
	const clientName = searchParams.get("client_name");

	const { entity, consent } = useAuth();
	const isValidRequest = Boolean(
		clientId && clientName && redirectUri && responseType && challengeMethod === "S256" && code_challenge && scopes.length > 0,
	);

	function capitalizeInitials(text: string): string {
		return text.charAt(0).toUpperCase() + text.slice(1);
	}

	async function handleConsent(isGranted: boolean) {
		await consent(
			{
				consent: isGranted,
				client_id: clientId ?? "",
				scopes,
			},
			searchParams,
		);
	}

	return (
		<AuthInterface
			title={`Authorize ${clientName ? capitalizeInitials(clientName ?? "") : "nothing"}`}
			description={isValidRequest ? "Only authorize clients you trust" : "Authorization request is incomplete or invalid"}
			footer=""
		>
			<Card className="my-2">
				<CardHeader>
					<CardTitle>{entity?.name}</CardTitle>
					<CardDescription>{entity?.email}</CardDescription>
				</CardHeader>
			</Card>

			{!isValidRequest && (
				<Card className="w-full max-w-md text-center bg-transparent">
					<CardHeader>
						<CardDescription className="font-subheading text-base text-muted-foreground">
							Caught you! Trying funny things are we?
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Button asChild>
							<Link to={APP_ROUTES.root}>Return Home</Link>
						</Button>
					</CardContent>
				</Card>
			)}

			{isValidRequest && (
				<Card className="bg-transparent ring-0">
					<CardContent>
						<h1 className="text-sm lg:text-base text-nowrap truncate">Third-party is requesting access to: </h1>
						<ul className="list-disc list-inside mx-2 my-1">
							{scopes.map(scope => (
								<li key={scope}>{capitalizeInitials(scope)}</li>
							))}
						</ul>
					</CardContent>
					<CardFooter className="gap-3 bg-transparent">
						<Button disabled={!isValidRequest} className="grow" onClick={() => void handleConsent(true)}>
							Authorize
						</Button>
						<Button variant="outline" className="" disabled={!isValidRequest} onClick={() => void handleConsent(false)}>
							Cancel
						</Button>
					</CardFooter>
				</Card>
			)}
		</AuthInterface>
	);
}

export function verifyEmailPage() {
	const navigate = useNavigate();
	const magicToken = window.location.pathname.split("/").pop() ?? "";
	const isValidRequest = Boolean(magicToken) && magicToken.startsWith('mt');
	const { verifyEmail } = useAuth();

	async function handleVerify() {
		await verifyEmail(magicToken);
	} 

	function handleCancel() {
		navigate("/");
	}
	return (
		<AuthInterface
			title={"Verify your email"}
			description=""
			footer=""
		>
			{isValidRequest && (
				<Card className="bg-transparent ring-0">
					<CardHeader>
						<CardDescription className="font-subheading text-base text-muted-foreground">
							You are agreeing to Terms of Use by clicking the button below.
						</CardDescription>
					</CardHeader>
					<CardContent className="gap-3 bg-transparent flex flex-col">
						<Button disabled={!isValidRequest} className="grow" onClick={handleVerify}>
							Verify
						</Button>
						<Button variant="outline" className="" disabled={!isValidRequest} onClick={handleCancel}>
							Cancel
						</Button>
					</CardContent>
				</Card>
			)}
		</AuthInterface>
	);
}
