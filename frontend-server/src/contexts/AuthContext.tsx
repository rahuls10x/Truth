import { API_ROUTES } from "@/config/routes";
import useApiService from "@/hooks/useApiService";
import type { AuthenticatedEntity, EntityType } from "@/types";
import { type LoginSchema, type OrganizationSignupSchema, type SignupSchema } from "@/types/validation";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useNotification } from "./NotificationContext";
import { useNavigate } from "react-router-dom";

interface ConsentRequest {
	consent: boolean;
	client_id: string;
	scopes: string[];
}

interface AuthContextType {
	isLoading: boolean;
	entity: AuthenticatedEntity | null;
	entityType: EntityType | null;
	userSignup: (values: SignupSchema) => Promise<void>;
	organizationSignup: (values: OrganizationSignupSchema) => Promise<void>;
	userLogin: (values: LoginSchema) => Promise<void>;
	organizationLogin: (values: LoginSchema) => Promise<void>;
	logout: () => Promise<void>;
	consent: (values: ConsentRequest, authorizationQuery: URLSearchParams) => Promise<void>;
	verifyEmail:(magicToken:string) => Promise<{type: EntityType} | undefined>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
	const [entity, setEntity] = useState<AuthenticatedEntity | null>(null);
	const [entityType, setEntityType] = useState<EntityType | null>(null);
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const { getRequest, postRequest, putRequest } = useApiService(import.meta.env.VITE_API_URL);
	const { error, success } = useNotification();
	const navigate = useNavigate();

	async function userSignup(values: SignupSchema): Promise<void> {
		const response = await postRequest(API_ROUTES.user.signup, {
			name: values.name,
			email: values.email,
			password: values.password,
		});
		if (!response) return;

		if (response && response.success) {
			success("User signup successful", response.message ?? "Your account is ready.");
			navigate("/user/login");
			return;
		}

		if (!response.success && response.error) {
			error("User signup failed", response.error);
			return;
		}
	}

	async function organizationSignup(values: OrganizationSignupSchema): Promise<void> {
		const response = await postRequest(API_ROUTES.organization.signup, {
			userName: values.userName,
			organizationName: values.organizationName,
			domain: values.domain,
			email: values.email,
			password: values.password,
		});
		if (!response) return;

		if (response && response.success) {
			success("Organization signup successful", response.message ?? "Your account is ready.");
			navigate("/org/login");
			return;
		}

		if (!response.success && response.error) {
			error("Organization signup failed", response.error);
			return;
		}
	}

	async function login(entityKind: EntityType, values: LoginSchema): Promise<void> {
		const endpoint = entityKind === "user" ? API_ROUTES.user.login : API_ROUTES.organization.login;
		const response = await postRequest<AuthenticatedEntity>(endpoint, values);
		if (!response) return;

		if (response.success && response.message && response.data) {
			success("Login successful", response.message);
			setEntityType(entityKind);
			setEntity(response.data);
		}

		if (!response.success && response.error) {
			error("Login failed", response.error);
		}
	}

	const userLogin = (values: LoginSchema) => login("user", values);

	const organizationLogin = (values: LoginSchema) => login("organization", values);

	async function logout(): Promise<void> {
		const response = await getRequest(API_ROUTES.logout);
		if (!response) return;

		if (!response.success && response.error) {
			error("Logout failed", response.error);
			return;
		}

		setEntity(null);
		setEntityType(null);
		success("Logged out", response.message ?? "Your session has ended.");
		navigate("/");
	}

	async function consent(values: ConsentRequest, authorizationQuery: URLSearchParams): Promise<void> {
		const response = await postRequest(API_ROUTES.consent, values);
		if (!response) return;

		if (!response.success && response.error) {
			error("Consent request failed", response.error);
			return;
		}

		if (!values.consent) {
			const redirectUri = authorizationQuery.get("redirect_uri");
			if (!redirectUri) {
				error("Consent request failed", "The redirect URI is missing.");
				return;
			}

			const deniedRedirect = new URL(redirectUri);
			deniedRedirect.searchParams.set("error", "access_denied");
			const state = authorizationQuery.get("state");
			if (state) deniedRedirect.searchParams.set("state", state);
			window.location.assign(deniedRedirect.toString());
			return;
		}

		success("Consent granted", response?.message ?? "Returning to the client application.");
		const redirectUrl = `${import.meta.env.VITE_API_URL}/authorize?${authorizationQuery.toString()}`;
		window.location.assign(redirectUrl);
		return;
	}

	async function verifyEmail(magicToken:string):Promise<{type: EntityType} | undefined> {
		const response = await putRequest<{type: EntityType}>(`${API_ROUTES.verifyEmail}/${magicToken}`, {});
		if (!response) return;

		if (!response.success && response.error) {
			error("Unable to verify email", response.error);
			return;
		}

		if (response.success && response.message && response.data) {
			success("Email verified", response.message);
			return response.data;
		}
	}

	useEffect(() => {
		void getRequest<{ name: string, email: string, type: EntityType }>(API_ROUTES.whoAmI).then(response => {
			setIsLoading(false);
			if (!response) return;

			if (response.success && response.data) {
				setEntity({ name: response.data.name, email: response.data.email });
				setEntityType(response.data.type);
				return;
			}

			if (!response.success && response.error) {
				setEntity(null);
				setEntityType(null);
				error("Automatic login failed", response.error);
			}
		});
	}, []);

	return (
		<AuthContext.Provider
			value={{
				isLoading,
				entity,
				entityType,
				userLogin,
				organizationLogin,
				userSignup,
				organizationSignup,
				logout,
				consent,
				verifyEmail
			}}
		>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth(): AuthContextType {
	const context = useContext(AuthContext);
	if (!context) throw new Error("useAuth must be used within an AuthProvider");
	return context;
}
