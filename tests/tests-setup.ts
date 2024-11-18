import prisma from "@/prisma/client";
import { execSync } from "child_process";
import dotenv from "dotenv";
import path from "path";
import fs from "fs-extra";

export const email = "test@test.com";
export const password = "test_Passw0rd";
export const firstName = "SomeTestFirstName";
export const lastName = "SomeTestLastName";
export const position = "test_user";

// Load .env.test file
dotenv.config({ path: path.resolve(__dirname, "../.env.test") });
const { DATABASE_URL, FILES_PATH, LOGS_PATH } = process.env;

// Apply migrations to the test database
execSync("npx prisma migrate deploy", { stdio: "inherit" });

export async function createTestUser() {
	// Hash the password
	const { Argon2id } = await import("oslo/password");
	const hashedPassword = await new Argon2id().hash(password);
	// Write the test user to the database
	const testingUser = await prisma.user.create({
		data: {
			email: email,
			hashedPassword,
			firstName: firstName,
			lastName: lastName,
			status: "active",
			active: true,
			position: position,
		},
	});
	return testingUser;
}

export async function deleteTestDb() {
	await prisma.$disconnect();
	// Remove the database file
	if (DATABASE_URL) {
		const dbPath = DATABASE_URL.replace("file:", "");
		if (fs.existsSync(dbPath)) {
			fs.unlinkSync(dbPath);
			console.log(`Database file ${dbPath} removed.`);
		} else {
			console.log(`Database file ${dbPath} does not exist.`);
		}
	}
}
