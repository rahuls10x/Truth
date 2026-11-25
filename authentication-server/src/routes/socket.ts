import type AuthController from "../controllers/AuthController.js";
import type UserController from "../controllers/UserController.js";
import type OrganizationController from "../controllers/OrganizationController.js";
import type { StandardResponse } from "../types/index.js";
import type { AppSocket } from "../types/socketTypes.js";

export function createSocketRoomId(entityId:string | undefined):string{
    return "room_" + entityId;
}

export function joinSocketRooms(socket: AppSocket) {
    const roomId = createSocketRoomId(socket.data.entityId);
    socket.data.roomId = roomId;

    socket.join(roomId);
}

export function socketRoutes(socket: AppSocket, userController:UserController, authController:AuthController, orgController:OrganizationController) {
    socket.on("viewUserProfile", (callback:(response:StandardResponse) => void) => {
        userController.viewUserProfile(socket, callback);
    });

    socket.on("updateUserProfile", (data:unknown, callback:(response:StandardResponse) => void) =>{
        userController.updateUserProfile(socket, data, callback);
    });

    socket.on("viewActiveSessions",(callback:(response:StandardResponse)=> void)=> {
        authController.getEntitySessions(socket, callback);
    });

    socket.on("revokeEntitySession", (data:unknown, callback:(response:StandardResponse)=> void)=> {
        authController.revokeEntitySession(socket, data, callback );
    });

    socket.on("revokeAllEntitySessions", (callback:(response:StandardResponse)=> void)=> {
        authController.revokeAllEntitySessions(socket, callback);
    });

    socket.on("getClients", (callback:(response:StandardResponse)=> void)=> {
        orgController.getClients(socket, callback);
    });

    socket.on("createClient", (data: unknown, callback: (response: StandardResponse) => void) => {
        orgController.createClient(socket, data, callback);
    });
    
	socket.on("disconnect", reason => {
		console.log(`[WebSocket] Client disconnected: ${socket.id} (Reason: ${reason})`);
	});
}
