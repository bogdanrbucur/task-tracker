// src/features/auth/queries/get-auth.ts

import { cache } from "react";
import prisma from "@/prisma/client";

export interface UserPermissions {
	canCreateUsers: boolean;
	canCreateTasks: boolean;
	canCloseTasks: boolean;
}

export const getUserPermissions = cache(async (userId: string): Promise<UserPermissions> => {
	console.log(`Checking permissions for user ${userId}`);
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
