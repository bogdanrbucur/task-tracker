// server function to register new user
"use server";

import { UserExtended } from "@/app/users/getUserById";
import { UpdateUser } from "@/app/users/new/submitUser";
import prisma from "@/prisma/client";
import { redirect } from "next/navigation";

export default async function updateUser(data: UpdateUser, editingUser: UserExtended) {
	try {
		const updatedUser = await prisma.user.update({
			where: { id: data.id },
			data: {
				firstName: data.firstName,
				lastName: data.lastName,
				email: data.email,
				position: data.position,
				departmentId: data.departmentId ? Number(data.departmentId) : null,
				managerId: data.managerId ? data.managerId : null,
				isAdmin: data.isAdmin ? true : false,
			},
		});
		// First check if the user has an avatar
		const currentAvatar = await prisma.avatar.findFirst({
			where: {
				userId: data.id,
			},
		});

		// Update the avatar if a new one was uploaded
		if (data.avatarPath) {
			// Delete the current avatar if a new one was uploaded
			if (currentAvatar) {
				// Delete the database entry
				await prisma.avatar.delete({
					where: {
						userId: currentAvatar.userId,
					},
				});
			}

			const newAvatar = await prisma.avatar.create({
				data: {
					userId: data.id,
					path: data.avatarPath,
				},
			});
		}

		if (!updatedUser) throw new Error("Failed to update user.");
		return updatedUser;
	} catch (error) {
		console.log(error);
	}
	redirect("/");
}
