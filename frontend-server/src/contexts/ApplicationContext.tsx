import type { Client, Session } from "@/types";
import type { ProfileSchema, CreateClientSchema } from "@/types/validation";
import { createContext, useContext, type ReactNode } from "react";
import useProfile from "@/hooks/useProfile";
import useSessions from "@/hooks/useSessions";
import useClients from "@/hooks/useClients";
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
	clientMethods: {
		clientData: Client[] | null;
		getClients: () => Promise<boolean>;
		createClient: (values: CreateClientSchema) => Promise<Client | null>;
	};
}

const ApplicationContext = createContext<ApplicationContextType | undefined>(undefined);

export function ApplicationProvider({ children }: { children: ReactNode }) {
	const { changeUserName, logout } = useAuth();
	const profileMethods = useProfile(changeUserName);
	const sessionMethods = useSessions(logout);
	const clientMethods = useClients();

	return (
		<ApplicationContext.Provider
			value={{
				profileMethods,
				sessionMethods,
				clientMethods,
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
