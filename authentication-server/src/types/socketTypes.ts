import type { Socket } from "socket.io";

export interface SocketData {
	sessionId?: string;
	entityId?: string;
	entityType?:string;
	roomId?: string;
}

export type AppSocket = Socket<any, any, any, SocketData>;
