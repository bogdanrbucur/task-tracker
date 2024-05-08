// Server action to get the given user's permissions

import { cache } from "react";
import prisma from "@/prisma/client";

export interface UserPermissions {
	canCreateUsers: boolean;
	canCreateTasks: boolean;
	canCloseTasks: boolean;
}

export const getUserPermissions = cache(async (userId: string): Promise<UserPermissions> => {
	const user = await prisma.user.findUnique({ where: { id: userId } });
	// Get all the permissions from the UserPermissions interface and build the response object
	if (!user) {
		return {
			canCreateUsers: false,
			canCreateTasks: false,
			canCloseTasks: false,
		};
	}

	return {
		canCreateUsers: user?.canCreateUsers ? user?.canCreateUsers : false,
		canCreateTasks: user?.canCreateTasks ? user?.canCreateTasks : false,
		canCloseTasks: user?.canCloseTasks ? user?.canCloseTasks : false,
	};
});
