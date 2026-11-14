import type UserController from "../controllers/UserController.js";
import type { StandardResponse } from "../types/index.js";
import type { AppSocket } from "../types/socketTypes.js";

export function JoinSocketRooms(socket: AppSocket) {
    const roomId = `room_${socket.data.entityId}`;
    socket.data.roomId = roomId;

    socket.join(roomId);
}

export function SocketRoutes(socket: AppSocket, userController:UserController) {
    socket.on("viewUserProfile", (callback:(response:StandardResponse) => void) => {
        userController.viewUserProfile(socket, callback);
    });

    socket.on("updateUserProfile", (data:unknown, callback:(response:StandardResponse) => void) =>{
        userController.updateUserProfile(socket, data, callback);
    })
    
	socket.on("disconnect", reason => {
		console.log(`[WebSocket] Client disconnected: ${socket.id} (Reason: ${reason})`);
	});
}
