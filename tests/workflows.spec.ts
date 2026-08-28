/**
 * Coverage for flows that existed but had no test: avatar upload, source attachments, task reopen
 * and cancel, department CRUD, the Excel export, user creation, filtering, and the email outbox.
 *
 * Named so it sorts after the other specs (full-cycle, security, workflows) and creates its own
 * users and tasks, so it neither depends on nor disturbs them.
 *
 * Emails are only ever queued: sendEmail() writes to EmailOutbox and the worker that drains it is
 * not started by `npm test`. Asserting on that table is how "an email was sent" is verified.
 */

import { Browser, Page, expect, test } from "@playwright/test";
import fs from "fs-extra";
import path from "path";
import {
	avatarFileExists,
	createTaskFor,
	getAttachmentsForTask,
	getDepartments,
	getQueuedEmailsFor,
	getTaskById,
	getUserByEmail,
	testAttachmentPath,
	testImagePath,
	user1email,
	usersPass,
	wfEmployeeEmail as employeeEmail,
	wfManagerEmail as managerEmail,
} from "./tests-setup";

test.describe.configure({ mode: "serial" });

const adminStatePath = "./tests/wf-admin-state.json";
const managerStatePath = "./tests/wf-manager-state.json";
const employeeStatePath = "./tests/wf-employee-state.json";

// Created through the UI during the test, so it must not exist beforehand
const createdUserEmail = "wf-created@resend.dev";

const reopenTaskTitle = "***Workflow Reopen Task***";
const cancelTaskTitle = "***Workflow Cancel Task***";

let managerId: string;
let employeeId: string;
let reopenTaskId: number;
let cancelTaskId: number;

async function signIn(browser: Browser, email: string, statePath: string) {
	const context = await browser.newContext();
	const page = await context.newPage();
	await page.goto("/sign-in");
	await page.fill('input[name="email"]', email);
	await page.fill('input[name="password"]', usersPass);
	await page.click('button[type="submit"]');
	await expect(page).toHaveURL("/");
	await context.storageState({ path: statePath });
	await context.close();
}

/** Numbered screenshot + attachment, same convention as full-cycle-task.spec.ts. */
async function shot(page: Page, name: string) {
	const ss = await page.screenshot({ path: `./tests/${name}.png` });
	test.info().attach(name.replace(/^\d+-/, ""), { body: ss, contentType: "image/png" });
}

async function settle(page: Page) {
	await page.waitForLoadState("networkidle");
	await page.waitForTimeout(1000);
}

test.describe("Workflow coverage", () => {
	test.beforeAll(async ({ browser }) => {
		// Seeded in globalSetup so they are present before getUsers() warms its 5 minute cache -
		// otherwise they never show up in the assignee dropdown
		managerId = (await getUserByEmail(managerEmail))!.id;
		employeeId = (await getUserByEmail(employeeEmail))!.id;

		reopenTaskId = (await createTaskFor(employeeId, managerId, reopenTaskTitle)).id;
		cancelTaskId = (await createTaskFor(employeeId, managerId, cancelTaskTitle)).id;

		await signIn(browser, user1email, adminStatePath);
		await signIn(browser, managerEmail, managerStatePath);
		await signIn(browser, employeeEmail, employeeStatePath);
	});

	test.afterAll(async () => {
		for (const p of [adminStatePath, managerStatePath, employeeStatePath]) await fs.remove(p);
	});

	//
	// User creation and the welcome email
	//

	test("An admin can create a user and a welcome email is queued", async ({ browser }) => {
		const context = await browser.newContext({ storageState: adminStatePath });
		const page = await context.newPage();

		await page.goto("/users/new");
		await settle(page);
		await page.fill('input[name="firstName"]', "Created");
		await page.fill('input[name="lastName"]', "ByTest");
		await page.fill('input[name="email"]', createdUserEmail);
		await page.fill('input[name="position"]', "Created through the UI");

		await page.click('text="Select a department"');
		await page.waitForSelector('div[role="listbox"]', { state: "visible" });
		await page.locator('div[role="listbox"]').locator("div").first().click();

		await page.click('button:has-text("Create User")');
		await settle(page);

		const created = await getUserByEmail(createdUserEmail);
		expect(created, "the user should have been created").toBeTruthy();
		expect(created?.status).toBe("unverified");

		const emails = await getQueuedEmailsFor(createdUserEmail);
		expect(emails.length, "a welcome email should be queued").toBeGreaterThan(0);
		expect(emails[0].subject).toContain("New account created");
		await shot(page, "34-user-created");

		await context.close();
	});

	//
	// Avatar upload and serving
	//

	test("An avatar can be uploaded and is then served from the API", async ({ browser }) => {
		const context = await browser.newContext({ storageState: adminStatePath });
		const page = await context.newPage();

		await page.goto(`/users/${employeeId}/edit`);
		await settle(page);

		await page.locator('input[type="file"]').first().setInputFiles(testImagePath);
		await page.click('button:has-text("Save User")');
		await settle(page);

		expect(avatarFileExists(employeeId), "the avatar file should exist under FILES_PATH").toBe(true);

		const response = await context.request.get(`/api/avatars/${employeeId}`);
		expect(response.status()).toBe(200);
		expect(response.headers()["content-type"]).toContain("image");
		expect((await response.body()).length).toBeGreaterThan(0);
		await shot(page, "35-avatar-uploaded");

		await context.close();
	});

	//
	// Source attachments (the full-cycle spec only covers completion attachments)
	//

	test("A source attachment can be added on the task edit page and downloaded", async ({ browser }) => {
		const context = await browser.newContext({ storageState: managerStatePath });
		const page = await context.newPage();

		await page.goto(`/tasks/${reopenTaskId}/edit`);
		await settle(page);

		await page.locator('input[type="file"][accept="*"]').setInputFiles(testAttachmentPath);
		await page.fill('input[name="newDescription"]', "Workflow source attachment");
		// Disambiguated from the checklist editor's own "Add" button, now also on this page
		await page.click('[data-testid="attachment-add-button"]');
		await settle(page);

		const attachments = await getAttachmentsForTask(reopenTaskId);
		const source = attachments.find((a) => a.type === "source");
		expect(source, "a source attachment should have been stored").toBeTruthy();
		expect(source?.path).toBe("source_test-att.txt");
		await shot(page, "36-source-attachment-added");

		await test.step("It downloads with the stored filename", async () => {
			const response = await context.request.get(`/api/attachments/${source!.id}`);
			expect(response.status()).toBe(200);
			expect(response.headers()["content-disposition"]).toContain("source_test-att.txt");
			expect((await response.body()).length).toBeGreaterThan(0);
		});

		await context.close();
	});

	//
	// Complete -> reopen
	//

	test("A completed task can be reopened by the manager", async ({ browser }) => {
		await test.step("The assignee completes it", async () => {
			const context = await browser.newContext({ storageState: employeeStatePath });
			const page = await context.newPage();
			await page.goto(`/tasks/${reopenTaskId}`);
			await settle(page);
			await page.click('button:has-text("Complete")');
			await page.fill('[name="completeComment"]', "Completed by the workflow test.");
			await page.click('button:has-text("Confirm")');
			await settle(page);

			expect((await getTaskById(reopenTaskId))?.statusId, "should be Pending Review").toBe(2);
			await shot(page, "37-task-completed");
			await context.close();
		});

		await test.step("The manager reopens it", async () => {
			const context = await browser.newContext({ storageState: managerStatePath });
			const page = await context.newPage();
			await page.goto(`/tasks/${reopenTaskId}`);
			await settle(page);
			await page.click('button:has-text("Reopen")');
			await page.fill('[name="reopenComment"]', "Reopening this from the workflow test.");
			await page.click('button:has-text("Confirm")');
			await settle(page);

			const task = await getTaskById(reopenTaskId);
			expect(task?.statusId, "should be back In Progress").toBe(1);
			expect(task?.completedOn).toBeNull();

			await expect(page.getByTestId("status-badge")).toContainText("In Progress");
			await shot(page, "38-task-reopened");
			await context.close();
		});

		await test.step("The assignee is emailed about the reopening", async () => {
			const emails = await getQueuedEmailsFor(employeeEmail);
			expect(emails.some((e) => e.subject.toLowerCase().includes("reopened"))).toBe(true);
		});
	});

	//
	// Cancel
	//

	test("A task can be cancelled by the manager", async ({ browser }) => {
		const context = await browser.newContext({ storageState: managerStatePath });
		const page = await context.newPage();

		await page.goto(`/tasks/${cancelTaskId}`);
		await settle(page);
		await page.click('button:has-text("Cancel")');
		await page.fill('[name="cancelComment"]', "Cancelling this from the workflow test.");
		await page.click('button:has-text("Confirm")');
		await settle(page);

		expect((await getTaskById(cancelTaskId))?.statusId, "should be Cancelled").toBe(4);
		await expect(page.getByTestId("status-badge")).toContainText("Cancelled");
		await shot(page, "39-task-cancelled");

		await context.close();
	});

	//
	// Department CRUD
	//

	test("An admin can create, rename and delete a department", async ({ browser }) => {
		const context = await browser.newContext({ storageState: adminStatePath });
		const page = await context.newPage();
		const name = "Workflow Department";
		const renamed = "Workflow Department Renamed";

		await test.step("Create", async () => {
			await page.goto("/departments");
			await settle(page);
			await page.click('button:has-text("New Department")');
			await page.fill('input[name="deptName"]', name);
			await page.click('button:has-text("Confirm")');
			await settle(page);

			expect((await getDepartments()).map((d) => d.name)).toContain(name);
			await shot(page, "40-department-created");
		});

		await test.step("Rename", async () => {
			await page.goto("/departments");
			await settle(page);
			const row = page.locator("tr", { hasText: name });
			await row.locator('button:has-text("Rename")').click();
			await page.fill('input[name="deptName"]', renamed);
			await page.click('button:has-text("Confirm")');
			await settle(page);

			const departments = await getDepartments();
			expect(departments.map((d) => d.name)).toContain(renamed);
			expect(departments.map((d) => d.name)).not.toContain(name);
			await shot(page, "41-department-renamed");
		});

		await test.step("Delete", async () => {
			await page.goto("/departments");
			await settle(page);
			const row = page.locator("tr", { hasText: renamed });
			await row.locator('button:has-text("Delete")').click();
			await page.click('button:has-text("Confirm")');
			await settle(page);

			expect((await getDepartments()).map((d) => d.name)).not.toContain(renamed);
			await shot(page, "42-department-deleted");
		});

		await context.close();
	});

	//
	// Excel export
	//

	test("The Excel export downloads the filtered task list", async ({ browser }) => {
		const context = await browser.newContext({ storageState: adminStatePath, acceptDownloads: true });
		const page = await context.newPage();

		await page.goto("/tasks");
		await settle(page);

		const [download] = await Promise.all([page.waitForEvent("download"), page.click('button:has-text("Export")')]);
		expect(download.suggestedFilename()).toBe("Tasks.xlsx");

		const target = path.join("./tasks", "workflow-export.xlsx");
		await download.saveAs(target);
		expect(fs.existsSync(target)).toBe(true);
		expect(fs.statSync(target).size).toBeGreaterThan(0);
		fs.unlinkSync(target);
		await shot(page, "43-excel-export");

		await context.close();
	});

	//
	// Filtering
	//

	test("The task list can be filtered by status and by user", async ({ browser }) => {
		const context = await browser.newContext({ storageState: adminStatePath });
		const page = await context.newPage();

		await test.step("Cancelled-only shows the cancelled task and not the reopened one", async () => {
			await page.goto("/tasks?status=4");
			await settle(page);
			await expect(page.getByText(cancelTaskTitle)).toBeVisible();
			await expect(page.getByText(reopenTaskTitle)).toHaveCount(0);
			await shot(page, "44-tasks-filtered-by-status");
		});

		await test.step("Filtering by assignee keeps that user's tasks", async () => {
			await page.goto(`/tasks?user=${employeeId}`);
			await settle(page);
			await expect(page.getByText(reopenTaskTitle)).toBeVisible();
			await shot(page, "45-tasks-filtered-by-user");
		});

		await test.step("Filtering by a user with no tasks yields nothing", async () => {
			await page.goto(`/tasks?user=${managerId}`);
			await settle(page);
			await expect(page.getByText(reopenTaskTitle)).toHaveCount(0);
			await expect(page.getByText(cancelTaskTitle)).toHaveCount(0);
		});

		await context.close();
	});

	//
	// Email outbox
	//

	test("Task assignment and completion emails are queued", async ({ browser }) => {
		const context = await browser.newContext({ storageState: managerStatePath });
		const page = await context.newPage();
		const title = "***Workflow Assignment Email Task***";

		await page.goto("/tasks/new");
		await settle(page);
		await page.fill('input[name="title"]', title);
		await page.fill('textarea[name="description"]', "A task created to assert that the assignment email is queued.");

		await page.click('button:has-text("Pick a date")');
		while (!(await page.locator('text="December 2026"').isVisible())) await page.click('[aria-label="Go to the Next Month"]');
		await page.click('button:has-text("31")');

		await page.click('text="Select a user..."');
		await page.waitForSelector('div[role="listbox"]', { state: "visible" });
		await page.locator('div[role="listbox"]').locator("text=Employee").first().click();

		await page.click('button:has-text("Create Task")');
		await settle(page);

		const emails = await getQueuedEmailsFor(employeeEmail);
		expect(emails.some((e) => e.subject.includes("New task assigned")), "an assignment email should be queued").toBe(true);
		// The manager was emailed when the earlier task was completed
		const managerEmails = await getQueuedEmailsFor(managerEmail);
		expect(managerEmails.some((e) => e.subject.toLowerCase().includes("ready for review"))).toBe(true);
		await shot(page, "46-task-assignment-email-queued");

		await context.close();
	});
});
