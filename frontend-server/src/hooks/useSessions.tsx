import { useSocket } from "@/contexts/SocketContext";
import { useNotification } from "@/contexts/NotificationContext";
import type { Session, SessionUpdateEventResponses, SocketStandardResponse } from "@/types";
import { useCallback, useEffect, useState } from "react";

export default function useSessions(onSessionRevoked?: () => void) {
	const [sessionsData, setSessionsData] = useState<Session[] | null>(null);
	const { socket, isConnected } = useSocket();
	const { error, success } = useNotification();

	const sessions = useCallback(async (): Promise<boolean> => {
		if (!socket || !isConnected) return false;

		return new Promise(resolve => {
			socket.emit("viewActiveSessions", (response: SocketStandardResponse<Session[]>) => {
				if (response && response.success && response.data) {
					setSessionsData(response.data);
					resolve(true);
					return;
				}
				if (response && !response.success && response.error) {
					error("Unable to load sessions", response.error);
				}
				resolve(false);
			});
		});
	}, [socket, isConnected, error]);

	const revokeSession = useCallback(
		async (sessionRef: string): Promise<boolean> => {
			if (!socket || !isConnected) return false;

			return new Promise(resolve => {
				socket.emit("revokeEntitySession", { sessionRef }, (response: SocketStandardResponse) => {
					if (response && response.success) {
						if (response.message) {
							success("Session revoked", response.message);
						}
						setSessionsData(prev => (prev ? prev.filter(session => session.sessionRef !== sessionRef) : prev));
						resolve(true);
						return;
					}
					if (response && !response.success && response.error) {
						error("Unable to revoke session", response.error);
					}
					resolve(false);
				});
			});
		},
		[socket, isConnected, success, error],
	);

	const revokeAllSessions = useCallback(async (): Promise<boolean> => {
		if (!socket || !isConnected) return false;

		return new Promise(resolve => {
			socket.emit("revokeAllEntitySessions", (response: SocketStandardResponse) => {
				if (response && response.success) {
					if (response.message) {
						success("All Sessions are revoked", response.message);
					}
					setSessionsData(prev => (prev ? prev.filter(session => session.isCurrent) : prev));
					resolve(true);
					return;
				}
				if (response && !response.success && response.error) {
					error("Unable to revoke sessions", response.error);
				}
				resolve(false);
			});
		});
	}, [socket, isConnected, success, error]);

	useEffect(() => {
		if (!socket || !isConnected) return;

		const handleSessionRevoked = (event: SessionUpdateEventResponses) => {
			if (!event) return;

			switch(event.operation){
				case "newLogin":
					setSessionsData(prev => (prev ? [...prev, event.data] : prev));
					break;
				
				case "sessionRevoked":
					setSessionsData(prev => (prev ? prev.filter(session => session.sessionRef !== event.data.sessionRef) : prev));
					break;

				case "logoutCurrent":
					onSessionRevoked?.();
					break;
				case "allSessionsRevokedExceptCurrent":
					setSessionsData(prev => (prev ? prev.filter(session => session.isCurrent) : prev));
			}
		};

		socket.on("sessionUpdated", handleSessionRevoked);

		return () => {
			socket.off("sessionUpdated", handleSessionRevoked);
		};
	}, [socket, isConnected, onSessionRevoked]);

	return { sessionsData, sessions, revokeSession, revokeAllSessions };
}
