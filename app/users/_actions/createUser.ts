// server function to register new user
"use server";

import { getAuth } from "@/actions/auth/get-auth";
import { getPermissions } from "@/actions/auth/get-permissions";
import { UserExtended } from "@/app/users/_actions/getUserById";
import { NewUser } from "@/app/users/new/submitUser";
import { logger } from "@/lib/utilityFunctions";
import prisma from "@/prisma/client";
import { sendEmail } from "../../email/email";
import generatePassChangeToken from "../../password-reset/_actions/generatePassChangeToken";

export default async function createUser(data: NewUser, editingUser: UserExtended) {
	// Check user permissions
	const { user: agent } = await getAuth();
	const userPermissions = await getPermissions(agent?.id);
	if (!userPermissions.isAdmin) return { message: "You do not have permission to perform this action." };

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
				createdByUserId: editingUser.id,
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
		return { error };
	}
}
