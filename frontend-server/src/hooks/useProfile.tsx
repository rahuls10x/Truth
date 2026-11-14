import { useSocket } from "@/contexts/SocketContext";
import type { ProfileUpdateInput, SocketStandardResponse } from "@/types";
import type { ProfileSchema } from "@/types/validation";
import { useCallback, useEffect, useState } from "react";

export default function useProfile(changeUserName:(name:string)=> void) {
	const [userProfileDetails, setUserProfileDetails] = useState<ProfileSchema | null>(null);
	const { socket, isConnected } = useSocket();

	const profile = useCallback(async (): Promise<void> => {
		if (!socket || !isConnected) return;

		return new Promise(resolve => {
			socket.emit("viewUserProfile", (response: SocketStandardResponse<ProfileSchema>) => {
				if (response && response.success && response.data) {
					setUserProfileDetails(response.data);
					changeUserName(response.data.name);
				}
				resolve();
			});
		});
	}, [socket, isConnected]);

	const updateProfile = useCallback(
		async (values: ProfileSchema): Promise<void> => {
			if (!socket || !isConnected || !userProfileDetails) return;

			const profileUpdateInput = {
				...(values.name !== userProfileDetails.name && { name: values.name }),
				...(values.age !== userProfileDetails.age && { age: values.age }),
				...(values.gender !== userProfileDetails.gender && { gender: values.gender }),
			};

			return new Promise(resolve => {
				socket.emit("updateUserProfile", profileUpdateInput, (response: SocketStandardResponse<typeof profileUpdateInput>) => {
					console.log(response);
					if (response && response.success && response.data) {
						setUserProfileDetails(prev => ({
							...(prev ?? userProfileDetails),
							...profileUpdateInput,
						}));
					}
                    if(profileUpdateInput.name) changeUserName(profileUpdateInput.name);
					resolve();
				});
			});
		},
		[socket, isConnected, userProfileDetails],
	);

	useEffect(() => {
		if (!socket || !isConnected) return;

		const handleUserProfileUpdated = (event: { operation: "userProfileUpdated"; data: ProfileUpdateInput }) => {
			if (!event || !event.operation || event.operation !== "userProfileUpdated") return;

			setUserProfileDetails(prev => {
                if(!prev) return null;
				return {
					name: event.data.name ?? prev.name,
					age: event.data.age ?? prev.age,
					gender: event.data.gender ?? prev.gender,
					email: prev.email,
				};
			});
            if(event.data.name) changeUserName(event.data.name);
		};

		socket.on("userProfileUpdated", handleUserProfileUpdated);

		return () => {
			socket.off("userProfileUpdated", handleUserProfileUpdated);
		};
	}, [socket, isConnected]);

	return { userProfileDetails, profile, updateProfile };
}
