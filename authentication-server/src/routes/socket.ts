import type { AppSocket } from "../types/socketTypes.js";

export function JoinSocketRooms(socket: AppSocket) {
    const roomId = `room_${socket.data.entityId}`;
    socket.data.roomId = roomId;

    socket.join(roomId);
}

export function SocketRoutes(socket: AppSocket) {
    
	socket.on("disconnect", reason => {
		console.log(`[WebSocket] Client disconnected: ${socket.id} (Reason: ${reason})`);
	});
}
