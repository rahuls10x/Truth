import Logo from "@/assets/Logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";
import { APP_ROUTES, getLoginRoute } from "@/config/routes";
import { useAuth } from "@/contexts/AuthContext";
import type { EntityType } from "@/types";
import {
	ForgotPasswordSchema,
	LoginSchema,
	OrganizationSignupSchema,
	ResetPasswordSchema,
	SignupSchema,
	type LoginSchema as LoginValues,
	type OrganizationSignupSchema as OrganizationSignupValues,
	type SignupSchema as SignupValues,
} from "@/types/validation";
import { zodResolver } from "@hookform/resolvers/zod";
import { CircleCheckIcon, CircleXIcon, EyeIcon, EyeOffIcon, LoaderCircleIcon } from "lucide-react";
import { useEffect, useState, type ComponentProps, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";

// Smaller shared components

interface PasswordFieldProps extends Omit<ComponentProps<typeof Input>, "type"> {
	label: string;
	error?: string;
	resetLink?: string;
}

function PasswordField({ id, label, error, resetLink, ...props }: PasswordFieldProps) {
	const [isVisible, setIsVisible] = useState(false);

	return (
		<Field data-invalid={Boolean(error)}>
			<div className="w-full flex items-center">
				<FieldLabel htmlFor={id} className="grow">
					{label}
				</FieldLabel>
				{resetLink && (
					<Link to={resetLink} className="font-medium text-xs text-foreground underline-offset-4 hover:underline">
						Forgot Password
					</Link>
				)}
			</div>
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
		<Button type="submit" disabled={isSubmitting} className="font-button font-semibold grow">
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
	const resetPasswordPath = isUser ? APP_ROUTES.user.forgotPassword : APP_ROUTES.organization.forgotPassword;
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
						resetLink={resetPasswordPath}
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

function ForgotPassword({ entityType }: { entityType: EntityType }) {
	const loginLink = getLoginRoute(entityType);
	const { forgotPassword } = useAuth();
	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<ForgotPasswordSchema>({
		resolver: zodResolver(ForgotPasswordSchema),
		defaultValues: { email: "" },
	});

	async function handleForgotPassword(values: ForgotPasswordSchema) {
		console.log(values);
		await forgotPassword(entityType, values);
	}

	return (
		<AuthInterface title="Forgot Password" description="We'll email you password reset link" footer="">
			<form onSubmit={handleSubmit(handleForgotPassword)} noValidate>
				<FieldGroup>
					<Field data-invalid={Boolean(errors.email)}>
						<FieldLabel htmlFor={`${entityType}-login-email`}>{entityType === "user" ? "User email" : "Organization email"}</FieldLabel>
						<Input
							id={`${entityType}-login-email`}
							type="email"
							autoComplete="email"
							aria-invalid={Boolean(errors.email)}
							{...register("email")}
						/>
						<FieldError>{errors.email?.message}</FieldError>
					</Field>
					<SubmitButton isSubmitting={isSubmitting} label="Send link" />
					<Button variant={"ghost"} asChild>
						<Link to={loginLink}> Login instead</Link>
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

export function UserForgotPasswordPage() {
	return <ForgotPassword entityType="user" />;
}

export function OrganizationForgotPasswordPage() {
	return <ForgotPassword entityType="organization" />;
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
	const [step, setStep] = useState<number>(1);
	const { organizationSignup } = useAuth();
	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<OrganizationSignupValues>({
		resolver: zodResolver(OrganizationSignupSchema),
		defaultValues: { userName: "", organizationName: "", domain: "", email: "", password: "", confirmPassword: "" },
	});

	const nextStep = () => {
		if (step < 3) setStep(step + 1);
	};
	const prevStep = () => {
		if (step > 1) setStep(step - 1);
	};

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
					{step === 1 && (
						<Field data-invalid={Boolean(errors.userName)}>
							<FieldLabel htmlFor="name">Administrator name</FieldLabel>
							<Input id="name" autoComplete="name" aria-invalid={Boolean(errors.userName)} {...register("userName")} />
							<FieldError>{errors.userName?.message}</FieldError>
						</Field>
					)}
					{step === 1 && (
						<Field data-invalid={Boolean(errors.email)}>
							<FieldLabel htmlFor="email">Administrator email</FieldLabel>
							<Input id="email" type="email" autoComplete="email" aria-invalid={Boolean(errors.email)} {...register("email")} />
							<FieldError>{errors.email?.message}</FieldError>
						</Field>
					)}

					{step === 2 && (
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
					)}
					{step === 2 && (
						<Field data-invalid={Boolean(errors.domain)}>
							<FieldLabel htmlFor="organization-domain">Domain</FieldLabel>
							<Input id="organization-domain" placeholder="example.com" aria-invalid={Boolean(errors.domain)} {...register("domain")} />
							<FieldError>{errors.domain?.message}</FieldError>
						</Field>
					)}

					{step === 3 && (
						<PasswordField
							id="password"
							label="Password"
							autoComplete="new-password"
							error={errors.password?.message}
							{...register("password")}
						/>
					)}
					{step === 3 && (
						<Field>
							<FieldLabel htmlFor="confirm-password">Confirm password</FieldLabel>
							<Input id="confirm-password" type="password" {...register("confirmPassword")} />
							<FieldError>{errors.confirmPassword?.message}</FieldError>
						</Field>
					)}

					<div className="flex mt-4 gap-2">
						<Button type="button" onClick={prevStep} disabled={step === 1} variant="outline" className="">
							Previous
						</Button>
						{step < 3 && <Button type="button" onClick={nextStep} disabled={step === 3} className="ml-auto grow">
							Next
						</Button>}
						{step === 3 && <SubmitButton isSubmitting={isSubmitting} label="Create organization" />}
					</div>
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
	const scopes = (searchParams.get("scope") ?? "").trim().split(/\s+/).filter(Boolean);
	const clientName = searchParams.get("client_name");
	const [isLoading, setIsLoading] = useState<"granted" | "denied" | false>(false);
	const { entity, consent } = useAuth();
	const isValidRequest = Boolean(
		clientId && clientName && redirectUri && responseType && challengeMethod === "S256" && code_challenge && scopes.length > 0,
	);

	function capitalizeInitials(text: string): string {
		return text.charAt(0).toUpperCase() + text.slice(1);
	}

	async function handleConsent(isGranted: boolean) {
		setIsLoading(isGranted ? "granted" : "denied");
		await consent(
			{
				consent: isGranted,
				client_id: clientId ?? "",
				scopes,
			},
			searchParams,
		);
		setIsLoading(false);
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
						<Button disabled={Boolean(isLoading)} className="grow" onClick={() => void handleConsent(true)}>
							Authorize {isLoading === "granted" && <LoaderCircleIcon className="animate-spin" />}
						</Button>
						<Button variant="outline" className="" disabled={Boolean(isLoading)} onClick={() => void handleConsent(false)}>
							Cancel {isLoading === "denied" && <LoaderCircleIcon className="animate-spin" />}
						</Button>
					</CardFooter>
				</Card>
			)}
		</AuthInterface>
	);
}

export function VerifyEmailPage() {
	const [status, setStatus] = useState<{ type: "user" | "organization" } | "error" | undefined>(undefined);
	const navigate = useNavigate();
	const { magicToken } = useParams();
	const isValidRequest = magicToken && magicToken.startsWith("mt");
	const { verifyEmail } = useAuth();

	async function handleVerify() {
		if (!isValidRequest) return;
		setStatus((await verifyEmail(magicToken)) ?? "error");
	}

	useEffect(() => {
		handleVerify();
	}, []);

	return (
		<AuthInterface title={"Email Verification"} description="" footer="">
			{isValidRequest && (
				<Empty className="w-full">
					<EmptyHeader>
						<EmptyMedia className="size-10">
							{status && status !== "error" && <CircleCheckIcon className="size-6" />}
							{!status && <Spinner className="size-6 animate-spin" />}
							{status === "error" && <CircleXIcon className="size-6" />}
						</EmptyMedia>
						<EmptyTitle className="font-heading text-lg">
							{status && status !== "error" && "Email verified"}
							{!status && "Processing your request"}
							{status === "error" && "Something went wrong"}
						</EmptyTitle>
						<EmptyDescription className="font-subheading text-sm">
							{status && status !== "error" && "Your email has been successfully verified. Visit to login page"}
							{!status && "Please wait while we process your request. Do not refresh the page."}
							{status === "error" && "Something went wrong. Please try again."}
						</EmptyDescription>
					</EmptyHeader>
					<EmptyContent>
						{status && status !== "error" && (
							<Button variant="outline" onClick={() => navigate(getLoginRoute(status?.type))}>
								Login
							</Button>
						)}
					</EmptyContent>
				</Empty>
			)}
			{!isValidRequest && (
				<Empty>
					<EmptyHeader>
						<EmptyDescription className="font-subheading text-base text-muted-foreground">
							Caught you! Trying funny things are we?
						</EmptyDescription>
					</EmptyHeader>
					<EmptyContent>
						<Button asChild>
							<Link to={APP_ROUTES.root}>Return Home</Link>
						</Button>
					</EmptyContent>
				</Empty>
			)}
		</AuthInterface>
	);
}

export function ResetPasswordPage() {
	const [status, setStatus] = useState<{ type: "user" | "organization" } | "error" | undefined>(undefined);
	const navigate = useNavigate();
	const { magicToken } = useParams();
	const isValidRequest = magicToken && magicToken.startsWith("mt");
	const { resetPassword } = useAuth();
	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<ResetPasswordSchema>({
		resolver: zodResolver(ResetPasswordSchema),
		defaultValues: { password: "", confirmPassword: "" },
	});

	async function handleResetPassword(values: ResetPasswordSchema) {
		if (!isValidRequest) return;
		setStatus((await resetPassword(magicToken, values)) ?? "error");
	}

	return (
		<AuthInterface title={"Reset Password"} description={!isSubmitting ? "" : "Enter your new password below"} footer="">
			{(status || isSubmitting) && (
				<Empty className="w-full">
					<EmptyHeader>
						<EmptyMedia className="size-10">
							{status && status !== "error" && <CircleCheckIcon className="size-6" />}
							{!status && <Spinner className="size-6 animate-spin" />}
							{status === "error" && <CircleXIcon className="size-6" />}
						</EmptyMedia>
						<EmptyTitle className="font-heading text-lg">
							{status && status !== "error" && "Password has been reset"}
							{!status && "Processing your request"}
							{status === "error" && "Something went wrong"}
						</EmptyTitle>
						<EmptyDescription className="font-subheading text-sm">
							{status && status !== "error" && "Your Password has been successfully reset. Visit to login page"}
							{!status && "Please wait while we process your request. Do not refresh the page."}
							{status === "error" && "Something went wrong. Please try again."}
						</EmptyDescription>
					</EmptyHeader>
					<EmptyContent>
						{status && status !== "error" && (
							<Button variant="outline" onClick={() => navigate(getLoginRoute(status?.type))}>
								Login
							</Button>
						)}
					</EmptyContent>
				</Empty>
			)}
			{!isValidRequest && (
				<Empty>
					<EmptyHeader>
						<EmptyDescription className="font-subheading text-base text-muted-foreground">
							Caught you! Trying funny things are we?
						</EmptyDescription>
					</EmptyHeader>
					<EmptyContent>
						<Button asChild>
							<Link to={APP_ROUTES.root}>Return Home</Link>
						</Button>
					</EmptyContent>
				</Empty>
			)}
			{!isSubmitting && !status && isValidRequest && (
				<form onSubmit={handleSubmit(handleResetPassword)}>
					<FieldGroup>
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
						<SubmitButton isSubmitting={isSubmitting} label="Reset Password" />
					</FieldGroup>
				</form>
			)}
		</AuthInterface>
	);
}
