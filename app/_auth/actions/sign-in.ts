// Server action to sign in a user
"use server";

import { lucia } from "@/lib/lucia";
import prisma from "@/prisma/client";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Argon2id } from "oslo/password";
import { z } from "zod";

export default async function signIn(prevState: any, formData: FormData) {
	// Define the Zod schema for the form data
	const schema = z.object({
		email: z.string().email("Invalid email address."),
		password: z.string(),
	});

	try {
		// Parse the form data using the schema
		// If validation fails, an error will be thrown and caught in the catch block
		const data = schema.parse({
			email: formData.get("email") as string,
			password: formData.get("password") as string,
		});

		// Find the user with the given email in the database
		const user = await prisma.user.findUnique({
			where: { email: data.email },
		});
		if (!user) throw new Error("Incorrect email or password.");

		// Verify the password using Argon2id
		const validPassword = await new Argon2id().verify(user.hashedPassword!, data.password);
		if (!validPassword) throw new Error("Incorrect email or password.");

		// Create a new session for the user. Lucia handles adding it to the database
		const session = await lucia.createSession(user.id, {});

		// Create a session cookie and set it in the response headers
		const sessionCookie = lucia.createSessionCookie(session.id);
		cookies().set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
	} catch (error) {
		// Handle Zod validation errors
		if (error instanceof z.ZodError) {
			for (const subError of error.errors) {
				return { message: subError.message };
			}
		} else {
			// Handle other errors
			return { message: (error as any).message };
		}
	}
	redirect("/");
}
