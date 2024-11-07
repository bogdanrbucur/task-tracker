// server function to add new task
"use server";

import { getAuth } from "@/actions/auth/get-auth";
import { logDate } from "@/lib/utilityFunctions";
import prisma from "@/prisma/client";
import log from "log-to-file";
import { revalidatePath } from "next/cache";
import { Argon2id } from "oslo/password";
import { z } from "zod";

export default async function changeUserPassword(prevState: any, formData: FormData) {
	// const rawFormData = Object.fromEntries(formData.entries());
	// console.log(rawFormData);

	// Check user permissions
	const { user: agent } = await getAuth();
	if (!agent) return { message: "You do not have permission to perform this action." };

	const passwordSchema = z
		.string()
		.min(8, { message: "Password must be at least 8 characters long." })
		.regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter." })
		.regex(/[!@#$%^&*(),.?":{}|<>]/, { message: "Password must contain at least one special character." })
		.regex(/\d/, { message: "Password must contain at least one number." });

	// Define the Zod schema for the form data
	const schema = z.object({
		id: z.string().length(25, { message: "Invalid user ID." }),
		oldPassword: z.string().min(6, { message: "Password must be at least 6 characters long." }),
		newPassword: passwordSchema,
		confirmPassword: passwordSchema,
	});

	try {
		// Parse the form data using the schema
		// If validation fails, an error will be thrown and caught in the catch block
		const data = schema.parse({
			id: formData.get("id") as string,
			oldPassword: formData.get("oldPassword") as string,
			newPassword: formData.get("newPassword") as string,
			confirmPassword: formData.get("confirmPassword") as string,
		});

		// Find the user with the given email in the database
		const user = await prisma.user.findUnique({
			where: { id: data.id },
		});
		if (!user) throw new Error("Incorrect email or password.");

		// Verify the password using Argon2id
		const validPassword = await new Argon2id().verify(user.hashedPassword!, data.oldPassword);
		if (!validPassword) {
			return { message: "Incorrect password." };
		}

		if (data.newPassword !== data.confirmPassword) {
			return { message: "Passwords do not match." };
		}

		// Randomly generated salt for the password hashing, no need to provide one
		const hashedPassword = await new Argon2id().hash(data.newPassword);
		const updatedUser = await prisma.user.update({
			where: { id: data.id },
			data: {
				hashedPassword,
			},
		});

		console.log(`User ${updatedUser.email} changed their password.`);
		log(`User ${updatedUser.email} changed their password.`, `${process.env.LOGS_PATH}/${logDate()}`);

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
