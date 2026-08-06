import prisma from "@/prisma/client";
import { execSync } from "child_process";
import dotenv from "dotenv";
import path from "path";
import fs from "fs-extra";

export const storageStatePath = "./tests/storageState.json";
export const user1email = "bounced@resend.dev";
export const user2email = "delivered@resend.dev";
export const usersPass = "test_Passw0rd";
export const user1firstName = "Admin";
export const user2firstName = "Normal";
export const user1lastName = "User";
export const user2lastName = "User";
export const user1position = "test_user_admin";
export const user2position = "Testing User Non-Admin";
export const taskTitle = "***E2E Automated Test Task***";
// Markdown, to exercise the rich-text description pipeline. The trailing raw HTML and
// javascript: link must render as inert text - see "Task description renders as rich text".
export const taskDescriptionLinkUrl = "https://example.com/docs";
export const taskDescription = `This is a **test task** created during automated testing workflows.

- first checklist item
- second checklist item

See [the docs](${taskDescriptionLinkUrl}) for details.

Inert checks: <script>alert('xss')</script> and [click](javascript:alert('xss'))`;
export const taskComment = `This is a test comment added during automated testing workflows @${user2firstName}`;
export const taskCompletionComment = `This is a test completion comment added during automated testing workflows`;
export const attachmentFilename = "test-att.txt";
export const testAttachmentPath = `./tests/${attachmentFilename}`;
// Generated in beforeAll rather than committed, so there is no binary fixture in the repo.
// Deliberately larger than DESCRIPTION_IMAGE_MAX_DIMENSION (1600) so the resize can be asserted.
export const testImageWidth = 2000;
export const testImagePath = "./tests/test-inline-image.png";
export const testAttachmentDescription = "Test text attachment";
export const taskClosingComment = `This is a test closing comment added during automated testing workflows`;
export const departmentName = "Test Department";

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
		// If the path starts with ../, resolve it relative to the current directory
		const resolvedDbPath = dbPath.startsWith("../") ? path.resolve(__dirname, dbPath) : dbPath;
		if (fs.existsSync(resolvedDbPath)) {
			fs.unlinkSync(resolvedDbPath);
			console.log(`Database file ${resolvedDbPath} removed.`);
		} else {
			console.log(`Database file ${resolvedDbPath} does not exist.`);
		}
	}
}

export async function deleteExistingScreenshots() {
	const screenshotsPath = "./tests/";
	// Delete all .png files in the folder
	const files = fs.readdirSync(screenshotsPath);
	for (const file of files) {
		if (file.endsWith(".png")) {
			fs.unlinkSync(path.join(screenshotsPath, file));
		}
	}
}

export async function createTestImage() {
	const sharp = (await import("sharp")).default;
	await sharp({ create: { width: testImageWidth, height: testImageWidth / 2, channels: 3, background: { r: 30, g: 90, b: 180 } } })
		.png()
		.toFile(testImagePath);
}

export async function deleteTestImage() {
	await fs.remove(testImagePath);
}

/** Rows in the DescriptionImage table - used to assert draft claiming and cleanup. */
export async function getDescriptionImages() {
	return prisma.descriptionImage.findMany();
}

/** Inline description image files actually on disk under FILES_PATH. */
export function countDescriptionImageFiles() {
	const dir = `${FILES_PATH}/descriptions`;
	return fs.existsSync(dir) ? fs.readdirSync(dir).length : 0;
}

export async function createTestDepartment() {
	const department = await prisma.department.create({
		data: {
			name: departmentName,
		},
	});

	return department;
}
