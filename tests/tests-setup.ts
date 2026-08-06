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

// Apply migrations to the test database. Called from globalSetup rather than at import time, so
// that the database can be dropped and recreated in the right order.
export function migrateTestDb() {
	execSync("npx prisma migrate deploy", { stdio: "inherit" });
}

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
		// SQLite leaves these behind after a crash; a stale journal corrupts the next run
		for (const suffix of ["-journal", "-wal", "-shm"]) {
			if (fs.existsSync(resolvedDbPath + suffix)) fs.unlinkSync(resolvedDbPath + suffix);
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

//
// Helpers for the security regression suite and the flows added alongside it
//

/** Look a seeded user up by email - tests need their cuid to forge ids and to assert on state. */
export async function getUserByEmail(email: string) {
	return prisma.user.findUnique({ where: { email } });
}

/**
 * An extra active user, for specs that must not disturb the two shared seed users.
 * Uses the same password as the seed users.
 */
export async function createExtraUser(
	email: string,
	opts: { firstName?: string; lastName?: string; isAdmin?: boolean; managerId?: string | null; departmentId?: number | null } = {}
) {
	const { Argon2id } = await import("oslo/password");
	const hashedPassword = await new Argon2id().hash(usersPass);
	return prisma.user.create({
		data: {
			email,
			hashedPassword,
			firstName: opts.firstName ?? "Extra",
			lastName: opts.lastName ?? "User",
			status: "active",
			active: true,
			position: "Security fixture user",
			isAdmin: opts.isAdmin ?? false,
			managerId: opts.managerId ?? null,
			// The user form requires a department, so fixtures that get edited through the UI need one
			departmentId: opts.departmentId ?? null,
		},
	});
}

/** A task in "In Progress" (statusId 1), created directly so specs do not depend on the UI. */
export async function createTaskFor(assignedToUserId: string, createdByUserId: string, title: string) {
	const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
	return prisma.task.create({
		data: {
			title,
			description: "Task created directly by the test suite as a fixture for authorization checks.",
			assignedToUserId,
			createdByUserId,
			statusId: 1,
			dueDate,
			originalDueDate: dueDate,
		},
	});
}

export async function deleteUserByEmail(email: string) {
	await prisma.user.deleteMany({ where: { email } });
}

// Fixture users for workflows.spec.ts. They are seeded in globalSetup rather than in that spec's
// beforeAll because getUsers() memoises the user list in a NodeCache for 5 minutes: a user created
// after the cache has been warmed by an earlier spec does not appear in the assignee dropdown.
export const wfManagerEmail = "wf-manager@resend.dev";
export const wfEmployeeEmail = "wf-employee@resend.dev";

export async function createWorkflowUsers(departmentId: number | null) {
	const manager = await createExtraUser(wfManagerEmail, { firstName: "Wf", lastName: "Manager", departmentId });
	const employee = await createExtraUser(wfEmployeeEmail, { firstName: "Wf", lastName: "Employee", managerId: manager.id, departmentId });
	return { manager, employee };
}

/** Emails are only ever queued by the app; the worker that drains EmailOutbox is not run by `npm test`. */
export async function getQueuedEmails() {
	return prisma.emailOutbox.findMany({ orderBy: { createdAt: "asc" } });
}

export async function getQueuedEmailsFor(recipient: string) {
	return prisma.emailOutbox.findMany({ where: { recipient }, orderBy: { createdAt: "asc" } });
}

/** The most recent password reset token for a user, as the emailed link would carry. */
export async function getLatestResetToken(userId: string) {
	return prisma.passwordResetToken.findFirst({ where: { userId }, orderBy: { id: "desc" } });
}

export async function countResetTokens(userId: string) {
	return prisma.passwordResetToken.count({ where: { userId } });
}

export async function getTaskByTitle(title: string) {
	return prisma.task.findFirst({ where: { title }, orderBy: { id: "desc" } });
}

export async function getTaskById(id: number) {
	return prisma.task.findUnique({ where: { id } });
}

export async function getCommentsForTask(taskId: number) {
	return prisma.comment.findMany({ where: { taskId }, orderBy: { id: "asc" } });
}

export async function getAttachmentsForTask(taskId: number) {
	return prisma.attachment.findMany({ where: { taskId }, orderBy: { time: "asc" } });
}

export async function getDepartments() {
	return prisma.department.findMany({ orderBy: { id: "asc" } });
}

/** Absolute path of the directory attachments are written into, for traversal assertions. */
export function attachmentsDirFor(taskId: number) {
	return path.resolve(`${FILES_PATH}/attachments/${taskId}`);
}

export function filesRoot() {
	return path.resolve(FILES_PATH ?? "./test/files");
}

export function avatarFileExists(userId: string) {
	const dir = `${FILES_PATH}/avatars`;
	if (!fs.existsSync(dir)) return false;
	return fs.readdirSync(dir).some((file) => path.parse(file).name === userId);
}

/** Wipe uploads between runs - these used to accumulate forever under FILES_PATH. */
export async function deleteTestFiles() {
	if (FILES_PATH && fs.existsSync(FILES_PATH)) await fs.remove(FILES_PATH);
}

/**
 * Empty every table, in foreign-key-safe order.
 *
 * Used instead of deleting the database file: `npm run dev-test` starts the Next server before
 * Playwright's globalSetup runs, so the server already holds an open handle to the SQLite file.
 * Unlinking it would leave the server reading the old, deleted inode while the seed data went to
 * a brand new file - which looks exactly like "the seeded user does not exist".
 */
export async function resetTestDb() {
	await prisma.change.deleteMany();
	await prisma.comment.deleteMany();
	await prisma.attachment.deleteMany();
	await prisma.descriptionImage.deleteMany();
	await prisma.task.deleteMany();
	await prisma.passwordResetToken.deleteMany();
	await prisma.session.deleteMany();
	await prisma.emailOutbox.deleteMany();
	await prisma.failedLoginAttempt.deleteMany();
	await prisma.avatar.deleteMany();
	await prisma.userStats.deleteMany();
	// Users reference each other via manager/createdByUser, so clear those links before deleting
	await prisma.user.updateMany({ data: { managerId: null, createdByUserId: null, departmentId: null } });
	await prisma.user.deleteMany();
	await prisma.department.deleteMany();
	await prisma.status.deleteMany();
}
