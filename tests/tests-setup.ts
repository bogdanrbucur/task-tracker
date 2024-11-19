import prisma from "@/prisma/client";
import { execSync } from "child_process";
import dotenv from "dotenv";
import path from "path";
import fs from "fs-extra";

export const user1email = "test1@test.com";
export const user2email = "test2@domain.net";
export const usersPass = "test_Passw0rd";
export const user1firstName = "SomeTestFirstName";
export const user2firstName = "AnotherTestFirstName";
export const user1lastName = "SomeTestLastName";
export const user2lastName = "AnotherTestLastName";
export const user1position = "test_user_admin";
export const user2position = "Testing User Non-Admin";

// Load .env.test file
dotenv.config({ path: path.resolve(__dirname, "../.env.test") });
const { DATABASE_URL, FILES_PATH, LOGS_PATH } = process.env;

// Apply migrations to the test database
execSync("npx prisma migrate deploy", { stdio: "inherit" });

export async function createTestUser() {
	const { Argon2id } = await import("oslo/password");
	// Hash the password for both users
	const hashedPassword = await new Argon2id().hash(usersPass);

	const testUser1 = await prisma.user.create({
		data: {
			email: user1email,
			hashedPassword,
			firstName: user1firstName,
			lastName: user1lastName,
			status: "active",
			active: true,
			position: user1position,
			isAdmin: true,
		},
	});

	const testUser2 = await prisma.user.create({
		data: {
			email: user2email,
			hashedPassword,
			firstName: user2firstName,
			lastName: user2lastName,
			status: "active",
			active: true,
			position: user2position,
			isAdmin: false,
		},
	});

	return { testUser1, testUser2 };
}

export async function createTaskStatuses() {
	const statuses = [
		{ name: "In Progress", displayName: "In Progress", color: "blue" },
		{ name: "Completed", displayName: "Pending Review", color: "green" },
		{ name: "Closed", displayName: "Closed", color: "gray" },
		{ name: "Cancelled", displayName: "Cancelled", color: "yellow" },
		{ name: "Overdue", displayName: "Overdue", color: "red" },
	];

	const taskStatuses = await prisma.status.createMany({ data: statuses });
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
