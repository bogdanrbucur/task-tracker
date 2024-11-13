// Server action to sign in a user
"use server";

import { lucia } from "@/lib/lucia";
import { logDate, normalizeIP } from "@/lib/utilityFunctions";
import prisma from "@/prisma/client";
import log from "log-to-file";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { Argon2id } from "oslo/password";
import { z } from "zod";

export default async function signIn(prevState: any, formData: FormData) {
	// Rate-limiting configuration
	const maxFailedAttemptsEmail = process.env.MAX_FAILED_ATTEMPTS_EMAIL || 5;
	const maxFailedAttemptsIP = process.env.MAX_FAILED_ATTEMPTS_IP || 20;
	const lockoutMinutes = process.env.LOCKOUT_MINUTES || 5;

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

		// Set email to lower case
		data.email = data.email.toLowerCase();

		// Count failed attempts per email
		const failedAttemptsEmail = await prisma.failedLoginAttempt.count({
			where: {
				email: data.email,
				timestamp: {
					gte: new Date(Date.now() - Number(lockoutMinutes) * 60 * 1000),
				},
			},
		});

		// Count failed attempts per IP
		const failedAttemptsIP = await prisma.failedLoginAttempt.count({
			where: {
				ipAddress: ip,
				timestamp: {
					gte: new Date(Date.now() - Number(lockoutMinutes) * 60 * 1000),
				},
			},
		});

		if (Number(failedAttemptsEmail) >= Number(maxFailedAttemptsEmail)) {
			console.log(`${data.email} from ${ip} reached the maximum number of failed attempts per user: ${failedAttemptsEmail}.`);
			log(`${data.email} from ${ip} reached the maximum number of failed attempts per user: ${failedAttemptsEmail}.`, `${process.env.LOGS_PATH}/${logDate()}`);
			throw new Error("Too many failed login attempts. Please try again later.");
		}
		if (Number(failedAttemptsIP) >= Number(maxFailedAttemptsIP)) {
			console.log(`${data.email} from ${ip} reached the maximum number of failed attempts per IP: ${failedAttemptsIP}.`);
			log(`${data.email} from ${ip} reached the maximum number of failed attempts per IP: ${failedAttemptsIP}.`, `${process.env.LOGS_PATH}/${logDate()}`);
			throw new Error("Too many failed login attempts. Please try again later.");
		}

		// Find the user with the given email in the database
		const user = await prisma.user.findUnique({
			where: { email: data.email, active: true },
		});
		if (!user) {
			console.log(`${data.email} attempting to login from ${ip}, but user does not exist.`);
			log(`${data.email} attempting to login from ${ip}, but user does not exist.`, `${process.env.LOGS_PATH}/${logDate()}`);

			// Log failed attempt
			await prisma.failedLoginAttempt.create({
				data: {
					email: data.email,
					ipAddress: ip,
				},
			});
			throw new Error("Incorrect email or password.");
		}

		// Verify the password using Argon2id
		const validPassword = await new Argon2id().verify(user.hashedPassword!, data.password);
		if (!validPassword) {
			console.log(`Valid user ${data.email} attempting to login from ${ip} with wrong password.`);
			log(`Valid user ${data.email} attempting to login from ${ip} with wrong password.`, `${process.env.LOGS_PATH}/${logDate()}`);

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
				email: data.email,
			},
		});

		// Create a new session for the user. Lucia handles adding it to the database
		const session = await lucia.createSession(user.id, {});

		// Create a session cookie and set it in the response headers
		const sessionCookie = lucia.createSessionCookie(session.id);
		cookies().set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);

		console.log(`User ${data.email} succesfully logged in from ${ip} and issued session ${sessionCookie.value}.`);
		log(`User ${data.email} succesfully logged in from ${ip} and issued session ${sessionCookie.value}.`, `${process.env.LOGS_PATH}/${logDate()}`);

		redirect("/");
	} catch (error) {
		// Handle Zod validation errors
		if (error instanceof z.ZodError) {
			for (const subError of error.errors) {
				console.log(subError.message);
				log(subError.message, `${process.env.LOGS_PATH}/${logDate()}`);
				return { message: subError.message };
			}
		} else {
			// Handle other errors
			console.log((error as any).message);
			log((error as any).message, `${process.env.LOGS_PATH}/${logDate()}`);
			return { message: (error as any).message };
		}
	}
}
