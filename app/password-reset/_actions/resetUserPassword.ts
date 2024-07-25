// server function to add new task
"use server";

import prisma from "@/prisma/client";
import { Argon2id } from "oslo/password";
import { z } from "zod";

export default async function resetUserPassword(prevState: any, formData: FormData) {
	const rawFormData = Object.fromEntries(formData.entries());
	console.log(rawFormData);

	const passwordSchema = z
		.string()
		.min(8, { message: "Password must be at least 8 characters long." })
		.regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter." })
		.regex(/[!@#$%^&*(),.?":{}|<>]/, { message: "Password must contain at least one special character." })
		.regex(/\d/, { message: "Password must contain at least one number." });

	// Define the Zod schema for the form data
	const schema = z.object({
		id: z.string().length(25, { message: "Invalid user ID." }),
		newPassword: passwordSchema,
		confirmPassword: passwordSchema,
	});

	try {
		// Parse the form data using the schema
		// If validation fails, an error will be thrown and caught in the catch block
		const data = schema.parse({
			id: formData.get("id") as string,
			newPassword: formData.get("newPassword") as string,
			confirmPassword: formData.get("confirmPassword") as string,
		});

		// Find the user with the given email in the database
		const user = await prisma.user.findUnique({
			where: { id: data.id },
		});
		if (!user) throw new Error("Incorrect email or password.");

		if (data.newPassword !== data.confirmPassword) {
			return { message: "Passwords do not match." };
		}

		// Randomly generated salt for the password hashing, no need to provide one
		const hashedPassword = await new Argon2id().hash(data.newPassword);
		const updatedUser = await prisma.user.update({
			where: { id: data.id },
			data: {
				hashedPassword,
				// Set the user's status to active if it's unverified (first time password set)
				status: user.status === "unverified" ? "active" : user.status,
				active: true,
			},
		});

		// Delete all the user's password reset token from the database
		await prisma.passwordResetToken.deleteMany({
			where: { userId: data.id },
		});
		return { success: true, message: null };
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
}
