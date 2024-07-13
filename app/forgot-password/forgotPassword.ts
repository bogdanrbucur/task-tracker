// server function to add new task
"use server";

import prisma from "@/prisma/client";
import { redirect } from "next/navigation";
import { alphabet, generateRandomString, sha256 } from "oslo/crypto";
import { encodeHex } from "oslo/encoding";
import { z } from "zod";
import { sendEmail } from "../email/email";

export default async function forgotUserPassword(prevState: any, formData: FormData) {
	const rawFormData = Object.fromEntries(formData.entries());
	console.log(rawFormData);

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

		// Find the user with the given email in the database
		const user = await prisma.user.findUnique({
			where: { email: data.email },
		});
		if (!user) return;

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
				expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 min
			},
		});

		// Send the user an email with a link to reset their password
		const emailStatus = await sendEmail({
			recipients: user.email,
			userFirstName: user.firstName,
			emailType: "passwordResetRequest",
			comment: token,
		});
	} catch (error) {
		// Handle Zod validation errors - return the message attribute back to the client
		if (error instanceof z.ZodError) {
			for (const subError of error.errors) {
				return { success: false, message: subError.message };
			}
		} else {
			// Handle other errors
			return { success: false, message: (error as any).message };
		}
	}
	// refresh the page
	redirect("/");
}
