// Server action to set a new password from a password reset link
"use server";

import { isPasswordAuthEnabled } from "@/lib/auth-flags";
import logger from "@/lib/logging";
import { lucia } from "@/lib/lucia";
import prisma from "@/prisma/client";
import { Argon2id } from "oslo/password";
import { z } from "zod";

// The reset link is the only thing proving the caller owns the account, so the token - not a
// user id - is what this action takes. A user id in the form would be trivially swapped for
// someone else's, since this action is reachable without a session.
const INVALID_TOKEN = "This password reset link is invalid or has expired. Please request a new one.";

export default async function resetUserPassword(prevState: any, formData: FormData) {
	// A stale link (e.g. from before password auth was turned off) must not still be able to set a
	// usable password - the page itself 404s too, but this is the actual authorization boundary.
	if (!isPasswordAuthEnabled()) return { success: false, message: "Password sign-in is not available." };

	const passwordSchema = z
		.string()
		.min(8, { message: "Password must be at least 8 characters long." })
		.regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter." })
		.regex(/[!@#$%^&*(),.?":{}|<>-]/, { message: "Password must contain at least one special character." })
		.regex(/\d/, { message: "Password must contain at least one number." });

	// Define the Zod schema for the form data
	const schema = z.object({
		token: z.string().min(1, { message: INVALID_TOKEN }),
		newPassword: passwordSchema,
		confirmPassword: passwordSchema,
	});

	try {
		// Parse the form data using the schema
		// If validation fails, an error will be thrown and caught in the catch block
		const data = schema.parse({
			token: formData.get("token") as string,
			newPassword: formData.get("newPassword") as string,
			confirmPassword: formData.get("confirmPassword") as string,
		});

		// Resolve the user from the token, never from client input
		const dbToken = await prisma.passwordResetToken.findUnique({
			where: { token: data.token },
		});
		if (!dbToken) return { success: false, message: INVALID_TOKEN };

		// Re-check expiry here as well as on the page - the page check is not an authorisation gate
		if (dbToken.expiresAt < new Date()) {
			await prisma.passwordResetToken.deleteMany({ where: { userId: dbToken.userId } });
			return { success: false, message: INVALID_TOKEN };
		}

		const user = await prisma.user.findUnique({
			where: { id: dbToken.userId },
		});
		// Only accounts that are meant to be reachable by a reset link, matching the page's own check.
		// A Microsoft-linked account is deliberately treated the same as an invalid token here, not a
		// more specific message - this endpoint is reachable without a session, so it must not become
		// a way to discover which accounts are linked.
		if (!user || !["active", "unverified"].includes(user.status) || user.entraOid) return { success: false, message: INVALID_TOKEN };

		if (data.newPassword !== data.confirmPassword) return { success: false, message: "Passwords do not match." };

		// Randomly generated salt for the password hashing, no need to provide one
		const hashedPassword = await new Argon2id().hash(data.newPassword);
		await prisma.user.update({
			where: { id: user.id },
			data: {
				hashedPassword,
				// Set the user's status to active if it's unverified (first time password set)
				status: user.status === "unverified" ? "active" : user.status,
				active: true,
			},
		});

		// Delete all the user's password reset tokens from the database - this is what makes the
		// token single-use
		await prisma.passwordResetToken.deleteMany({
			where: { userId: user.id },
		});

		// Drop every existing session. Password reset is the account recovery path: if it is being
		// used because the account was compromised, leaving the attacker's session alive defeats it.
		await lucia.invalidateUserSessions(user.id);

		logger(`Password reset completed for ${user.email}`);

		return { success: true, message: null };
	} catch (error) {
		// Handle Zod validation errors - return the message attribute back to the client
		if (error instanceof z.ZodError) for (const subError of error.errors) return { success: false, message: subError.message };
		// Handle other errors
		else return { success: false, message: (error as any).message };
	}
}
