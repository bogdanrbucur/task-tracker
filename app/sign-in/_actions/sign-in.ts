// Server action to sign in a user
"use server";

import { lucia } from "@/lib/lucia";
import { logDate, normalizeIP } from "@/lib/utilityFunctions";
import prisma from "@/prisma/client";
import log from "log-to-file";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Argon2id } from "oslo/password";
import { z } from "zod";
import { headers } from "next/headers";

export default async function signIn(prevState: any, formData: FormData) {
	// Rate-limiting configuration
	const maxFailedAttempts = 5;
	const lockoutMinutes = 10;

	// Get client IP address
	const headersList = headers();
	const rawIP = headersList.get("x-forwarded-for")?.split(",")[0].trim() || headersList.get("x-real-ip") || "";
	const ip = normalizeIP(rawIP);

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

		// Check for too many failed attempts
		const failedAttempts = await prisma.failedLoginAttempt.count({
			where: {
				OR: [{ email: data.email }, { ipAddress: ip }],
				timestamp: {
					gte: new Date(Date.now() - lockoutMinutes * 60 * 1000),
				},
			},
		});

		if (failedAttempts >= maxFailedAttempts) {
			console.log(`${data.email} attempting to login from ${ip} reached the maximum number of failed attempts.`);
			log(`${data.email} attempting to login from ${ip} reached the maximum number of failed attempts.`, `./logs/${logDate()}`);
			throw new Error("Too many failed login attempts. Please try again later.");
		}

		// Find the user with the given email in the database
		const user = await prisma.user.findUnique({
			where: { email: data.email, active: true },
		});
		if (!user) {
			console.log(`${data.email} attempting to login from ${ip}, but user does not exist.`);
			log(`${data.email} attempting to login from ${ip}, but user does not exist.`, `./logs/${logDate()}`);
			throw new Error("Incorrect email or password.");
		}

		// Verify the password using Argon2id
		const validPassword = await new Argon2id().verify(user.hashedPassword!, data.password);
		if (!validPassword) {
			console.log(`Valid user ${data.email} attempting to login from ${ip} with wrong password.`);
			log(`Valid user ${data.email} attempting to login from ${ip} with wrong password.`, `./logs/${logDate()}`);

			// Log failed attempt
			await prisma.failedLoginAttempt.create({
				data: {
					email: data.email,
					ipAddress: ip,
				},
			});
			throw new Error("Incorrect email or password.");
		}

		// Clear failed attempts on successful login
		await prisma.failedLoginAttempt.deleteMany({
			where: {
				OR: [{ email: data.email }, { ipAddress: ip }],
			},
		});

		// Create a new session for the user. Lucia handles adding it to the database
		const session = await lucia.createSession(user.id, {});

		// Create a session cookie and set it in the response headers
		const sessionCookie = lucia.createSessionCookie(session.id);
		cookies().set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);

		console.log(`User ${data.email} succesfully logged in from ${ip} and issued session ${sessionCookie.value}.`);
		log(`User ${data.email} succesfully logged in from ${ip} and issued session ${sessionCookie.value}.`, `./logs/${logDate()}`);
	} catch (error) {
		// Handle Zod validation errors
		if (error instanceof z.ZodError) {
			for (const subError of error.errors) {
				console.log(subError.message);
				log(subError.message, `./logs/${logDate()}`);
				return { message: subError.message };
			}
		} else {
			// Handle other errors
			console.log((error as any).message);
			log((error as any).message, `./logs/${logDate()}`);
			return { message: (error as any).message };
		}
	}
	redirect("/");
}
