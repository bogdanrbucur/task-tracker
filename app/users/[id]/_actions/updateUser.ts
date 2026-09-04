// server function to update an existing user
"use server";

import { PERMISSION_DENIED, getActor } from "@/actions/auth/require-auth";
import { UserExtended } from "@/app/users/_actions/getUserById";
import { UpdateUser } from "@/app/users/new/submitUser";
import logger from "@/lib/logging";
import prisma from "@/prisma/client";
import { invalidateUsersCache } from "@/app/users/_actions/getUsers";

export default async function updateUser(data: UpdateUser, editingUser: UserExtended) {
	// This is exported from a "use server" module, so it is a callable endpoint in its own right
	// and has to authorise independently of submitUser rather than trusting its arguments.
	const actor = await getActor();
	if (!actor) throw new Error(PERMISSION_DENIED);
	const { user: agent, permissions } = actor;

	// Admins may edit anyone; everyone else may only edit themselves
	if (!permissions.isAdmin && data.id !== agent.id) throw new Error(PERMISSION_DENIED);

	try {
		// The admin flag may only be changed by an admin, and never on your own account - otherwise
		// any user could grant themselves admin by posting isAdmin, and an admin could accidentally
		// lock themselves out.
		const target = await prisma.user.findUnique({ where: { id: data.id }, select: { isAdmin: true, entraOid: true } });
		const isAdmin = permissions.isAdmin && data.id !== agent.id ? !!data.isAdmin : (target?.isAdmin ?? false);

		const updatedUser = await prisma.user.update({
			where: { id: data.id },
			data: {
				firstName: data.firstName,
				lastName: data.lastName,
				email: data.email,
				position: data.position,
				departmentId: data.departmentId ? Number(data.departmentId) : null,
				managerId: data.managerId ? data.managerId : null,
				isAdmin,
			},
		});
		// First check if the user has an avatar
		const currentAvatar = await prisma.avatar.findFirst({ where: { userId: data.id } });

		// Update the avatar if a new one was uploaded. Never for Entra-linked users - their photo
		// is owned by Microsoft 365 and re-pulled on every sign-in.
		if (data.avatarPath && !target?.entraOid) {
			// Delete the current avatar if a new one was uploaded
			if (currentAvatar)
				// Delete the database entry
				await prisma.avatar.delete({ where: { userId: currentAvatar.userId } });

			const newAvatar = await prisma.avatar.create({
				data: {
					userId: data.id,
					path: data.avatarPath,
				},
			});
		}

		if (!updatedUser) throw new Error("Failed to update user.");
		// Name / department / manager changes must show through in the cached list the pickers use.
		invalidateUsersCache();
		return updatedUser;
	} catch (error: any) {
		logger(error?.message ? error.message : "Error updating user");
		// Surface the failure to submitUser rather than silently redirecting home
		throw error;
	}
}
