// src/features/auth/actions/sign-in.ts

"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Argon2id } from "oslo/password";
import { lucia } from "@/lib/lucia";
import prisma from "@/prisma/client";
import { z } from "zod";

const signIn = async (formData: FormData) => {
	// Define the Zod schema for the form data
	const schema = z.object({
		email: z.string().email(),
		password: z.string().min(8),
	});

	// Parse the form data using the schema
	const data = schema.parse({
		email: formData.get("email") as string,
		password: formData.get("password") as string,
	});

	try {
		const user = await prisma.user.findUnique({
			where: { email: data.email },
		});

		if (!user) {
			// https://www.robinwieruch.de/next-forms/
			throw new Error("Incorrect email or password");
		}

		const validPassword = await new Argon2id().verify(user.hashedPassword, data.password);

		if (!validPassword) {
			// https://www.robinwieruch.de/next-forms/
			throw new Error("Incorrect email or password");
		}

		const session = await lucia.createSession(user.id, {});
		const sessionCookie = lucia.createSessionCookie(session.id);

		cookies().set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
		redirect("/");
	} catch (error) {
		// TODO: add error feedback yourself
		// https://www.robinwieruch.de/next-forms/
	}
};

export { signIn };
