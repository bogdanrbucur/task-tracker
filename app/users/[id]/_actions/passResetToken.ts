// server function to create a password reset token and email the user a link to reset their password
"use server";

import { getAuth } from "@/actions/auth/get-auth";
import { getPermissions } from "@/actions/auth/get-permissions";
import { sendEmail } from "@/app/email/email";
import generatePassChangeToken from "@/app/password-reset/_actions/generatePassChangeToken";
import { isPasswordAuthEnabled } from "@/lib/auth-flags";
import logger from "@/lib/logging";
import prisma from "@/prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export default async function passResetToken(prevState: any, formData: FormData) {
	// const rawFormData = Object.fromEntries(formData.entries());
	// logger(rawFormData);

	// Check user permissions
	const { user: agent } = await getAuth();
	const userPermissions = await getPermissions(agent?.id);
	if (!userPermissions.isAdmin) return { message: "You do not have permission to perform this action." };

	// Define the Zod schema for the form data
	const schema = z.object({
		id: z.string().length(25, { message: "Invalid user ID." }),
	});

	try {
		// Parse the form data using the schema
		// If validation fails, an error will be thrown and caught in the catch block
		const data = schema.parse({
			id: formData.get("id") as string,
		});

		// Find the user with the given email in the database
		const user = await prisma.user.findUnique({
			where: { id: data.id },
		});
		if (!user) throw new Error("Incorrect email or password.");

		logger(`Password reset requested for user ${user.email}`);

		// If the user is already active, send a normal password reset email. This is the "reset your
		// password" action, not account activation, so it makes no sense once password sign-in itself
		// is off - unlike the unverified branch below, which stays available for M365 activation.
		if (user.status === "active") {
			if (!isPasswordAuthEnabled()) return { message: "Password sign-in is not available." };

			// The user signs in via M365 - an admin has to unlink them first, otherwise this would
			// hand out a password usable on the side even though the profile page hides the button.
			if (user.entraOid) return { message: "This user is linked to Microsoft 365. Unlink them first to reset a password." };

			logger("User is active, sending password reset email");
			// Create a unique random password reset token with default validity
			const token = await generatePassChangeToken(user);
			// Send the user an email with a link to reset their password
			const emailStatus = await sendEmail({
				recipients: user.email,
				userFirstName: user.firstName,
				emailType: "passwordResetRequest",
				comment: token,
			});

			return { queued: emailStatus.queued, emailId: emailStatus.id };
		} else if (user.status === "unverified") {
			logger("User is inactive, sending welcome email with a password set link");
			// Create a unique random password reset token with 48 hours validity
			const token = await generatePassChangeToken(user, 2880);
			// Send the user a welcome email with a link to set their password
			const emailStatus = await sendEmail({
				recipients: user.email,
				userFirstName: user.firstName,
				emailType: "newUserRegistration",
				comment: token,
			});

			// Update the lastWelcomeEmailSent of the user
			await prisma.user.update({
				where: { id: user.id },
				data: {
					lastWelcomeEmailSent: new Date(),
				},
			});

			return { queued: emailStatus.queued, emailId: emailStatus.id };
		}

		// return { dialogOpen: false };
	} catch (error) {
		// Handle Zod validation errors - return the message attribute back to the client
		if (error instanceof z.ZodError) for (const subError of error.errors) return { message: subError.message };
		// Handle other errors
		else return { message: (error as any).message };
	}
	// refresh the page
	revalidatePath(`/users/${formData.get("id")}`);
}
