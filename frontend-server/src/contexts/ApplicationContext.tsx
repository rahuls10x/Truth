import { API_ROUTES } from "@/config/routes";
import useApiService from "@/hooks/useApiService";
import type { Client, Session } from "@/types";
import type { ProfileSchema, CreateClientSchema } from "@/types/validation";
import { createContext, useContext, type ReactNode } from "react";
import { useNotification } from "./NotificationContext";
import useProfile from "@/hooks/useProfile";
import useSessions from "@/hooks/useSessions";
import { useAuth } from "./AuthContext";

interface ApplicationContextType {
	profileMethods: {
		userProfileDetails: ProfileSchema | null;
		profile: () => Promise<void>;
		updateProfile: (values: ProfileSchema) => Promise<void>;
	};
	sessionMethods: {
		sessionsData: Session[] | null;
		sessions: () => Promise<boolean>;
		revokeSession: (sessionRef: string) => Promise<boolean>;
		revokeAllSessions: () => Promise<boolean>;
	};
	clients: () => Promise<Client[] | void>;
	createClient: (values: CreateClientSchema) => Promise<Client | null>;
}

const ApplicationContext = createContext<ApplicationContextType | undefined>(undefined);

export function ApplicationProvider({ children }: { children: ReactNode }) {
	const { getRequest, postRequest } = useApiService(import.meta.env.VITE_API_URL);
	const { error, success } = useNotification();
	const { changeUserName, logout } = useAuth();
	const profileMethods = useProfile(changeUserName);
	const sessionMethods = useSessions(logout);

	async function clients(): Promise<Client[] | void>{
			const response = await getRequest(API_ROUTES.organization.clients);
			if(!response) return;

			if (!response.success && response.error) {
				error("Unable to load clients", response.error);
				return;
			}

			return response.data as Client[];
		};

	async function createClient(values: CreateClientSchema): Promise<Client | null>{
			const response = await postRequest(API_ROUTES.organization.clients, values);
			if (!response) return null;

			if (response.success && response.message) {
				success("Client created", response.message);
				return response.data as Client;
			}

			if (!response.success && response.error){
				error("Unable to create client", response.error );
			}
			return null;
		};

	return (
		<ApplicationContext.Provider
			value={{
				profileMethods,
				sessionMethods,
				clients,
				createClient,
			}}
		>
			{children}
		</ApplicationContext.Provider>
	);
}

export function useApplication(): ApplicationContextType {
	const context = useContext(ApplicationContext);
	if (!context) throw new Error("useApplication must be used within an ApplicationProvider");
	return context;
}
