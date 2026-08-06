// server function to add new task
"use server";

import logger from "@/lib/logging";
import prisma from "@/prisma/client";
import { redirect } from "next/navigation";
import { z } from "zod";
import { sendEmail } from "../../email/email";
import generatePassChangeToken from "../../password-reset/_actions/generatePassChangeToken";

// Tokens live 15 minutes, so this caps how many reset emails one address can be sent per window
const MAX_LIVE_RESET_TOKENS = 3;

export default async function forgotUserPassword(prevState: any, formData: FormData) {
	// const rawFormData = Object.fromEntries(formData.entries());
	// logger(rawFormData);

	// Define the Zod schema for the form data
	const schema = z.object({
		email: z.string().email({ message: "Invalid email address." }).nullable(),
	});

	try {
		// Parse the form data using the schema
		// If validation fails, an error will be thrown and caught in the catch block
		const data = schema.parse({
			email: formData.get("email") as string,
		});

		if (!data.email) return;

		// Set email to lower case
		data.email = data.email.toLowerCase();

		logger(`Password reset request received for email address ${data.email}`);

		// Find the user with the given email in the database
		const user = await prisma.user.findUnique({
			where: { email: data.email, active: true },
		});

		if (!user) {
			logger(`No active user found with email address ${data.email}`);
			return { success: true };
		}

		// Throttle per account, so this route cannot be used to mail-bomb someone.
		//
		// Deliberately NOT recorded in FailedLoginAttempt: sign-in counts that table by IP alone, so
		// writing reset requests into it would let anyone lock a whole office behind one NAT address
		// out of signing in just by submitting this form repeatedly.
		const liveTokens = await prisma.passwordResetToken.count({
			where: { userId: user.id, expiresAt: { gt: new Date() } },
		});
		if (liveTokens >= MAX_LIVE_RESET_TOKENS) {
			logger(`Password reset for ${data.email} throttled - ${liveTokens} unexpired tokens already issued.`);
			// Same response as the success path - never reveal whether the address exists
			return { success: true };
		}

		// Create a unique random password reset token
		const token = await generatePassChangeToken(user);

		// Send the user an email with a link to reset their password
		const emailStatus = await sendEmail({
			recipients: user.email,
			userFirstName: user.firstName,
			emailType: "passwordResetRequest",
			comment: token,
		});

		return { success: true };
	} catch (error) {
		// Handle Zod validation errors - return the message attribute back to the client
		if (error instanceof z.ZodError) {
			for (const subError of error.errors) {
				logger(`Password reset request error: ${subError.message}`);
				return { success: false, message: subError.message };
			}
		} else {
			// Handle other errors
			logger(`Password reset request error: ${error}`);
			return { success: false, message: (error as any).message };
		}
	}
	redirect("/");
}
