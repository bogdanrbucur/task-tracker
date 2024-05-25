// server function to register new user
"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Argon2id } from "oslo/password";
import { lucia } from "@/lib/lucia";
import prisma from "@/prisma/client";
import { UserExtended } from "@/app/users/getUserById";
import { NewUser, UpdateUser } from "@/app/users/new/submitUser";

export default async function updateUser(data: UpdateUser, editingUser: UserExtended) {
	try {
		// TODO implement salt
		const hashedPassword = await new Argon2id().hash(data.password);

		const updatedUser = await prisma.user.update({
			where: { id: data.id },
			data: {
				firstName: data.firstName,
				lastName: data.lastName,
				email: data.email,
				hashedPassword,
				position: data.position,
				departmentId: data.departmentId ? Number(data.departmentId) : null,
				managerId: data.managerId ? data.managerId : null,
				isAdmin: data.isAdmin ? true : false,
			},
		});

		if (!updatedUser) throw new Error("Failed to update user.");

		// const session = await lucia.createSession(newUser.id, {});
		// const sessionCookie = lucia.createSessionCookie(session.id);

		// cookies().set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
		return updatedUser;
	} catch (error) {
		console.log(error);
		// TODO: add error feedback yourself
		// https://www.robinwieruch.de/next-forms/
		// TODO: add error handling if user email is already taken
		// The Road to Next
	}

	redirect("/");
}