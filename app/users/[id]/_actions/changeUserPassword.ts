// server function to add new task
"use server";

import { getAuth } from "@/actions/auth/get-auth";
import { PERMISSION_DENIED } from "@/actions/auth/require-auth";
import { isPasswordAuthEnabled } from "@/lib/auth-flags";
import logger from "@/lib/logging";
import { lucia } from "@/lib/lucia";
import prisma from "@/prisma/client";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { Argon2id } from "oslo/password";
import { z } from "zod";

export default async function changeUserPassword(prevState: any, formData: FormData) {
	// There is no point letting anyone set a password that can never be used to sign in.
	if (!isPasswordAuthEnabled()) return { message: "Password sign-in is not available." };

	// const rawFormData = Object.fromEntries(formData.entries());
	// logger(rawFormData);
	// Check user permissions
	const { user: agent } = await getAuth();
	if (!agent) return { message: PERMISSION_DENIED };

	const passwordSchema = z
		.string()
		.min(8, { message: "Password must be at least 8 characters long." })
		.regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter." })
		.regex(/[!@#$%^&*(),.?":{}|<>]/, { message: "Password must contain at least one special character." })
		.regex(/\d/, { message: "Password must contain at least one number." });

	// Define the Zod schema for the form data.
	// No "id" field: you may only change your own password. Accepting a target id turned this into
	// an unthrottled password-guessing oracle against every other account, since the sign-in rate
	// limiter does not cover this path.
	const schema = z.object({
		oldPassword: z.string().min(6, { message: "Password must be at least 6 characters long." }),
		newPassword: passwordSchema,
		confirmPassword: passwordSchema,
	});

	try {
		// Parse the form data using the schema
		// If validation fails, an error will be thrown and caught in the catch block
		const data = schema.parse({
			oldPassword: formData.get("oldPassword") as string,
			newPassword: formData.get("newPassword") as string,
			confirmPassword: formData.get("confirmPassword") as string,
		});

		// Always the signed-in user's own account
		const user = await prisma.user.findUnique({
			where: { id: agent.id },
		});
		if (!user) throw new Error("Incorrect email or password.");

		// A Microsoft-linked account signs in via M365, not a password. An admin has to unlink it
		// first - otherwise this would let someone quietly keep a password usable on the side.
		if (user.entraOid) throw new Error("Your account is linked to Microsoft 365. Unlink it first to set a password.");

		// Verify the password using Argon2id
		const validPassword = await new Argon2id().verify(user.hashedPassword!, data.oldPassword);
		if (!validPassword) return { message: "Incorrect password." };

		if (data.newPassword !== data.confirmPassword) return { message: "Passwords do not match." };

		// Randomly generated salt for the password hashing, no need to provide one
		const hashedPassword = await new Argon2id().hash(data.newPassword);
		const updatedUser = await prisma.user.update({
			where: { id: agent.id },
			data: {
				hashedPassword,
			},
		});

		// Changing a password should end any other session on the account - otherwise a session
		// stolen earlier keeps working. The caller is then given a fresh one so they stay signed in.
		await lucia.invalidateUserSessions(agent.id);
		const session = await lucia.createSession(agent.id, {});
		const sessionCookie = lucia.createSessionCookie(session.id);
		const cookieStore = await cookies();
		cookieStore.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);

		logger(`User ${updatedUser.email} changed their password.`);

		return { dialogOpen: false };
	} catch (error) {
		// Handle Zod validation errors - return the message attribute back to the client
		if (error instanceof z.ZodError) for (const subError of error.errors) return { message: subError.message };
		// Handle other errors
		else return { message: (error as any).message };
	}
	// refresh the page
	revalidatePath(`/users/${agent.id}`);
}
