// Server action to get the given user's permissions

import prisma from "@/prisma/client";
import { cache } from "react";

export interface UserPermissions {
	isAdmin: boolean;
	isManager: boolean;
}

export const getPermissions = cache(async (userId: string | undefined): Promise<UserPermissions> => {
	if (!userId) {
		return { isAdmin: false, isManager: false };
	}

	const user = await prisma.user.findUnique({ where: { id: userId }, select: { isAdmin: true, subordinates: true } });
	// Get all the permissions from the UserPermissions interface and build the response object
	if (!user) {
		return { isAdmin: false, isManager: false };
	}

	let subordinates = user?.subordinates;
	subordinates = subordinates.filter((s) => s.active);

	return { isAdmin: user?.isAdmin ? user?.isAdmin : false, isManager: user?.subordinates.length > 0 ? true : false };
});
