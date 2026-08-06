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

	const user = await prisma.user.findUnique({ where: { id: userId }, select: { isAdmin: true, subordinates: { select: { id: true, status: true } } } });
	// Get all the permissions from the UserPermissions interface and build the response object
	if (!user) {
		return { isAdmin: false, isManager: false };
	}

	// Only active subordinates confer manager rights - an inactive report should not keep
	// someone in the manager role
	const subordinates = user.subordinates.filter((s) => s.status === "active");

	return { isAdmin: user.isAdmin ?? false, isManager: subordinates.length > 0 };
});
