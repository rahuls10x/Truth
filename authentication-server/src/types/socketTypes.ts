import type { Socket } from "socket.io";

export interface SocketData {
	sessionId?: string;
	entityId?: string;
	entityType?:"user" | "organization";
	roomId?: string;
}

export type AppSocket = Socket<any, any, any, SocketData>;
