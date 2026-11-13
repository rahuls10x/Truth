import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./AuthContext";

interface SocketContextType {
	socket: Socket | null;
	isConnected: boolean;
	disconnect: () => void;
}

const SocketContext = createContext<SocketContextType>({
	socket: null,
	isConnected: false,
	disconnect: () => {},
});

export function SocketProvider({ children }: { children: React.ReactNode }) {
	const { isAuthenticated, registerBeforeLogout } = useAuth();
	const [socket, setSocket] = useState<Socket | null>(null);
	const [isConnected, setIsConnected] = useState(false);
	const socketRef = useRef<Socket | null>(null);

	const disconnect = useCallback(() => {
		if (socketRef.current) {
			console.log("[WebSocket] Disconnecting websocket connection");
			socketRef.current.disconnect();
			socketRef.current = null;
			setSocket(null);
			setIsConnected(false);
		}
	}, []);

	// Guarantee WebSocket disconnects prior to backend session revocation
	useEffect(() => {
		const unregister = registerBeforeLogout?.(() => {
			disconnect();
		});
		return unregister;
	}, [registerBeforeLogout, disconnect]);

	useEffect(() => {
		if (!isAuthenticated) {
			disconnect();
			return;
		}

		const socketInstance = io(import.meta.env.VITE_API_URL || "http://localhost:4000", {
			withCredentials: true,
		});

		socketRef.current = socketInstance;

		socketInstance.on("connect", () => {
			setIsConnected(true);
			console.log("[WebSocket] Connected to server");
		});

		socketInstance.on("disconnect", (reason) => {
			setIsConnected(false);
			console.log("[WebSocket] Disconnected from server:", reason);
		});

		socketInstance.on("connect_error", (error) => {
			setIsConnected(false);
			console.error("[WebSocket] Connection error:", error.message);
		});

		setSocket(socketInstance);

		return () => {
			socketInstance.disconnect();
			if (socketRef.current === socketInstance) {
				socketRef.current = null;
			}
		};
	}, [isAuthenticated, disconnect]);

	return (
		<SocketContext.Provider value={{ socket, isConnected, disconnect }}>
			{children}
		</SocketContext.Provider>
	);
}

export const useSocket = () => useContext(SocketContext);
