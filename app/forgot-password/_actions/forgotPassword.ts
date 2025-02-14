// server function to add new task
"use server";

import { logDate } from "@/lib/utilityFunctions";
import prisma from "@/prisma/client";
import log from "log-to-file";
import { redirect } from "next/navigation";
import { z } from "zod";
import { sendEmail } from "../../email/email";
import generatePassChangeToken from "../../password-reset/_actions/generatePassChangeToken";

export default async function forgotUserPassword(prevState: any, formData: FormData) {
	// const rawFormData = Object.fromEntries(formData.entries());
	// console.log(rawFormData);

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

		console.log(`Password reset request received for email address ${data.email}`);
		log(`Password reset request received for email address ${data.email}`, `${process.env.LOGS_PATH}/${logDate()}`);

		// Find the user with the given email in the database
		const user = await prisma.user.findUnique({
			where: { email: data.email, active: true },
		});

		if (!user) {
			console.log(`No active user found with email address ${data.email}`);
			log(`No active user found with email address ${data.email}`, `${process.env.LOGS_PATH}/${logDate()}`);
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
				console.log("Password reset request error:", subError.message);
				return { success: false, message: subError.message };
			}
		} else {
			// Handle other errors
			console.log("Password reset request error:", error);
			return { success: false, message: (error as any).message };
		}
	}
	redirect("/");
}
