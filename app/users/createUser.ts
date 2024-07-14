// server function to register new user
"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Argon2id } from "oslo/password";
import { lucia } from "@/lib/lucia";
import prisma from "@/prisma/client";
import { UserExtended } from "@/app/users/getUserById";
import { NewUser } from "@/app/users/new/submitUser";
import generatePassChangeToken from "../_auth/actions/generatePassChangeToken";
import { sendEmail } from "../email/email";

export default async function createUser(data: NewUser, editingUser: UserExtended) {
	try {
		// TODO implement salt
		// const hashedPassword = await new Argon2id().hash(data.password!);

		const newUser = await prisma.user.create({
			data: {
				firstName: data.firstName,
				lastName: data.lastName,
				email: data.email,
				// hashedPassword,
				position: data.position,
				departmentId: data.departmentId ? Number(data.departmentId) : null,
				managerId: data.managerId ? data.managerId : null,
				isAdmin: data.isAdmin ? true : false,
			},
		});

		const token = await generatePassChangeToken(newUser, 2880);

		// Send the user a welcome email with a link to set their password
		const emailStatus = await sendEmail({
			recipients: newUser.email,
			userFirstName: newUser.firstName,
			emailType: "newUserRegistration",
			comment: token,
		});

		// Update the lastWelcomeEmailSent of the user
		await prisma.user.update({
			where: { id: newUser.id },
			data: {
				lastWelcomeEmailSent: new Date(),
			},
		});

		// const session = await lucia.createSession(newUser.id, {});
		// const sessionCookie = lucia.createSessionCookie(session.id);
		// cookies().set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
		return { newUser, emailStatus };
	} catch (error) {
		console.log(error);
		return { error };
	}

	redirect("/");
}
