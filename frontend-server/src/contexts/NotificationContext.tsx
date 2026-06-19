import { Toaster } from "@/components/ui/sonner";
import { createContext, useContext, type ReactNode } from "react";
import { toast } from "sonner";

type NotificationType = "success" | "warning" | "error" | "info";

interface NotificationContextType {
	success: (title: string, message: string) => void;
	warning: (title: string, message: string) => void;
	error: (title: string, message: string) => void;
	info: (title: string, message: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
	const addNotification = (type: NotificationType, title: string, message: string, duration = 5000) => {
		toast[type](title, {
			description: message,
			duration,
		});
	};

	const success = (title: string, message: string) => {
		addNotification("success", title, message, 3000);
	};

	const warning = (title: string, message: string) => {
		addNotification("warning", title, message, 3000);
	};

	const error = (title: string, message: string) => {
		addNotification("error", title, message, 5000);
	};

	const info = (title: string, message: string) => {
		addNotification("info", title, message, 5000);
	};

	return (
		<NotificationContext.Provider value={{ success, warning, error, info }}>
			{children}
			<Toaster position="bottom-center" />
		</NotificationContext.Provider>
	);
}

export function useNotification() {
	const context = useContext(NotificationContext);
	if (!context) {
		throw new Error("useNotification must be used within a NotificationProvider");
	}
	return context;
}
