// server function to create a password reset token and email the user a link to reset their password
"use server";

import generatePassChangeToken from "@/app/_auth/actions/generatePassChangeToken";
import { sendEmail } from "@/app/email/email";
import prisma from "@/prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export default async function passResetToken(prevState: any, formData: FormData) {
	// const rawFormData = Object.fromEntries(formData.entries());
	// console.log(rawFormData);

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

		// If the user is already active, send a normal password reset email
		if (user.status === "active") {
			console.log("User is active, so sending a normal password reset email");
			// Create a unique random password reset token with default validity
			const token = await generatePassChangeToken(user);
			// Send the user an email with a link to reset their password
			const emailStatus = await sendEmail({
				recipients: user.email,
				userFirstName: user.firstName,
				emailType: "passwordResetRequest",
				comment: token,
			});

			return { emailSent: emailStatus.success, message: null };
		} else if (user.status === "unverified") {
			console.log("User is inactive, so sending a welcome email with a password set link");
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

			return { emailSent: emailStatus.success, message: null };
		}

		// return { dialogOpen: false };
	} catch (error) {
		// Handle Zod validation errors - return the message attribute back to the client
		if (error instanceof z.ZodError) {
			for (const subError of error.errors) {
				return { message: subError.message };
			}
		} else {
			// Handle other errors
			return { message: (error as any).message };
		}
	}
	// refresh the page
	revalidatePath(`/users/${formData.get("id")}`);
}
