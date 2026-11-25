import { useSocket } from "@/contexts/SocketContext";
import { useNotification } from "@/contexts/NotificationContext";
import type { Client, ClientUpdateEventResponses, SocketStandardResponse } from "@/types";
import type { CreateClientSchema } from "@/types/validation";
import { useCallback, useEffect, useState } from "react";

export default function useClients() {
	const [clientData, setClientData] = useState<Client[] | null>(null);
	const { socket, isConnected } = useSocket();
	const { error, success } = useNotification();

	const getClients = useCallback(async (): Promise<boolean> => {
		if (!socket || !isConnected) return false;

		return new Promise(resolve => {
			socket.emit("getClients", (response: SocketStandardResponse<Client[]>) => {
				if (response && response.success && response.data) {
					setClientData(response.data);
					resolve(true);
					return;
				}
				if (response && !response.success && response.error) {
					error("Unable to load clients", response.error);
				}
				resolve(false);
			});
		});
	}, [socket, isConnected, error]);

	const createClient = useCallback(
		async (values: CreateClientSchema): Promise<Client | null> => {
			if (!socket || !isConnected) return null;

			return new Promise(resolve => {
				socket.emit("createClient", values, (response: SocketStandardResponse<Client>) => {
					if (response && response.success && response.data) {
						if (response.message) {
							success("Client created", response.message);
						}
						
						setClientData(prev => {
							if (!prev) return [response.data!];
							if (prev.some(c => c.clientId === response.data!.clientId)) return prev;
							return [response.data!, ...prev];
						});
						resolve(response.data);
						return;
					}
					if (response && !response.success && response.error) {
						error("Unable to create client", response.error);
					}
					resolve(null);
				});
			});
		},
		[socket, isConnected, success, error],
	);

	useEffect(() => {
		if (!socket || !isConnected) return;

		const handleClientUpdated = (event: ClientUpdateEventResponses) => {
			if (!event || !event.operation) return;

			switch (event.operation) {
				case "clientAdded": {
					const newClient = event.data;
					if (!newClient) return;

					setClientData(prev => {
						if (!prev) return null;
						if (prev.some(c => c.clientId === newClient.clientId)) return prev;
						return [newClient, ...prev];
					});
					break;
				}
			}
		};

		socket.on("clientUpdated", handleClientUpdated);

		return () => {
			socket.off("clientUpdated", handleClientUpdated);
		};
	}, [socket, isConnected]);

	return { clientData, getClients, createClient };
}
