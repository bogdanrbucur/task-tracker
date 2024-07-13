// server function to create a password reset token and email the user a link to reset their password
"use server";

import { sendEmail } from "@/app/email/email";
import prisma from "@/prisma/client";
import { revalidatePath } from "next/cache";
import { alphabet, generateRandomString, sha256 } from "oslo/crypto";
import { encodeHex } from "oslo/encoding";
import { z } from "zod";

export default async function passResetToken(prevState: any, formData: FormData) {
	const rawFormData = Object.fromEntries(formData.entries());
	console.log(rawFormData);

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

		// Create a unique random password reset token
		const secret = generateRandomString(10, alphabet("a-z", "0-9"));
		const encodedText = new TextEncoder().encode(user.email + Date.now().toString() + secret);
		const shaArrayBuffer = await sha256(encodedText);
		const token = encodeHex(shaArrayBuffer);

		console.log(token);

		// Write the token to the database and give it a 15 min expiry
		const newToken = await prisma.passwordResetToken.create({
			data: {
				userId: user.id,
				token,
				expiresAt: new Date(Date.now() + 15 * 60 * 1000),
			},
		});

		// Send the user an email with a link to reset their password
		const emailStatus = await sendEmail({
			recipients: user.email,
			userFirstName: user.firstName,
			emailType: "passwordResetRequest",
			comment: token,
		});

		// TODO Sonner...

		return { dialogOpen: false };
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
