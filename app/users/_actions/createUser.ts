// server function to register new user
"use server";

import { PERMISSION_DENIED, getAdminActor } from "@/actions/auth/require-auth";
import { UserExtended } from "@/app/users/_actions/getUserById";
import { NewUser } from "@/app/users/new/submitUser";
import logger from "@/lib/logging";
import prisma from "@/prisma/client";
import { sendEmail } from "../../email/email";
import generatePassChangeToken from "../../password-reset/_actions/generatePassChangeToken";

export default async function createUser(data: NewUser, editingUser: UserExtended) {
	// Check user permissions
	const actor = await getAdminActor();
	if (!actor) return { message: PERMISSION_DENIED };

	try {
		const newUser = await prisma.user.create({
			data: {
				firstName: data.firstName,
				lastName: data.lastName,
				email: data.email.toLowerCase(),
				position: data.position,
				departmentId: data.departmentId ? Number(data.departmentId) : null,
				managerId: data.managerId ? data.managerId : null,
				isAdmin: data.isAdmin ? true : false,
				// Attribution comes from the session, not from the caller's argument
				createdByUserId: actor.user.id,
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

		return { newUser, emailStatus };
	} catch (error: any) {
		logger(error?.message ? error.message : "Error creating user");
		// Prisma unique constraint violation - surface a friendly message to the client
		if (error?.code === "P2002") {
			const target = error?.meta?.target;
			const onEmail = Array.isArray(target) ? target.includes("email") : String(target ?? "").includes("email");
			if (onEmail) return { error: new Error("A user with this email address already exists.") };
		}
		return { error };
	}
}
