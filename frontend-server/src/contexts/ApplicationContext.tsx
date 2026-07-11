import { API_ROUTES } from "@/config/routes";
import useApiService from "@/hooks/useApiService";
import type { Client, Session } from "@/types";
import type { ProfileSchema, CreateClientSchema } from "@/types/validation";
import { createContext, useContext, type ReactNode } from "react";
import { useNotification } from "./NotificationContext";

interface ApplicationContextType {
	profile: () => Promise<ProfileSchema | void>;
	updateProfile: (values: ProfileSchema) => Promise<boolean>;
	clients: () => Promise<Client[] | void>;
	createClient: (values: CreateClientSchema) => Promise<Client | null>;
	sessions: () => Promise<Session[] | void>;
	revokeSession: (_id: string) => Promise<boolean>;
	revokeAllSessions: () => Promise<boolean>;
}

const ApplicationContext = createContext<ApplicationContextType | undefined>(undefined);

export function ApplicationProvider({ children }: { children: ReactNode }) {
	const { getRequest, postRequest, putRequest, deleteRequest} = useApiService(import.meta.env.VITE_API_URL);
	const { error, success } = useNotification();

	async function profile(): Promise<ProfileSchema | void>{
			const response = await getRequest(API_ROUTES.user.profile);
			if(!response) return;

			if (!response.success && response.error) {
				error("Unable to load profile", response.error);
				return;
			}

			return response.data as ProfileSchema;
		};

	async function updateProfile(values: ProfileSchema): Promise<boolean> {
			const response = await putRequest(API_ROUTES.user.profile, values);
			if (!response) return false;

			if (response.success && response.message) {
				success("Profile updated", response.message);
				return true;
			}

			if (!response.success && response.error){
				error("Unable to update profile", response.error );
			}
			return false;
		};

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

	async function sessions(): Promise<Session[] | void>{
		const response = await getRequest <Session[]>(API_ROUTES.session);
		if(!response) return;

		if (!response.success && response.error) {
			error("Unable to load sessions", response.error);
			return;
		}

		return response.data;
	}

	async function revokeSession(_id: string): Promise<boolean> {
		const response = await deleteRequest <undefined>(API_ROUTES.revokeSession,{_id: _id});
		if (!response) return false;

		if (response.success && response.message) {
			success("Session revoked", response.message);
			return true;
		}

		if (!response.success && response.error){
			error("Unable to revoke session", response.error );
			return false;
		}
		return false;
	}

	async function revokeAllSessions(): Promise<boolean> {
		const response = await deleteRequest <undefined>(API_ROUTES.revokeAllSessions,{});
		if (!response) return false;

		if (response.success && response.message) {
			success("All Sessions are revoked", response.message);
			return true;
		}

		if (!response.success && response.error){
			error("Unable to revoke sessions", response.error );
			return false;
		}
		return false;
	}
	
	return <ApplicationContext.Provider value={{
		profile,
		updateProfile,
		clients,
		createClient,
		sessions,
		revokeSession,
		revokeAllSessions
	}}>{children}</ApplicationContext.Provider>;
}

export function useApplication(): ApplicationContextType {
	const context = useContext(ApplicationContext);
	if (!context) throw new Error("useApplication must be used within an ApplicationProvider");
	return context;
}
