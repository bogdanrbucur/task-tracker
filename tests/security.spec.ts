/**
 * Regression tests for the authorization fixes.
 *
 * Each test reproduces an attack that used to succeed. They are written the way an attacker would
 * actually reach the server, which for this app means one of three things:
 *
 *  1. DOM tampering - overwrite a hidden input, then submit. The form serialises from the DOM, so
 *     this is exactly what a forged request looks like, with no action ids involved.
 *  2. context.request - for the plain /api routes.
 *  3. Session swapping - load a form as a user who is allowed to see it, then replace the session
 *     cookie before submitting. This is how a request from an unauthorised caller is reproduced
 *     for pages they cannot load at all. Each such test runs a positive control first, so a
 *     passing negative case cannot be an artefact of the submission simply not going through.
 */

import { Browser, Page, expect, test } from "@playwright/test";
import fs from "fs-extra";
import path from "path";
import {
	attachmentsDirFor,
	countResetTokens,
	createExtraUser,
	createTaskFor,
	deleteTaskById,
	deleteUserByEmail,
	getAttachmentsForTask,
	getDepartments,
	getLatestResetToken,
	getTaskById,
	getUserByEmail,
	testAttachmentPath,
	user1email,
	user1firstName,
	user2email,
	usersPass,
} from "./tests-setup";

test.describe.configure({ mode: "serial" });

const adminStatePath = "./tests/sec-admin-state.json";
const normalStatePath = "./tests/sec-normal-state.json";
const outsiderStatePath = "./tests/sec-outsider-state.json";
const preResetStatePath = "./tests/sec-prereset-state.json";
const managerAssigneeStatePath = "./tests/sec-manager-assignee-state.json";

// A user with no relationship to the fixture task: not the assignee, not their manager, not admin
const outsiderEmail = "security-outsider@resend.dev";
// Kept separate from the shared seed users so changing its password disturbs nothing else
const resetTargetEmail = "security-reset@resend.dev";
// An assignee who is themselves a manager (has an active report) - canEditTask lets this user
// edit their own task, unlike a plain assignee.
const managerAssigneeEmail = "security-manager-assignee@resend.dev";
// Reports to managerAssignee. Doubles as a plain assignee whose manager may edit their task.
const reportEmail = "security-report@resend.dev";

const securityTaskTitle = "***Security Fixture Task***";

let adminId: string;
let normalId: string;
let taskId: number;
let managerAssigneeId: string;
let reportId: string;
let managerAssigneeTaskId: number;
let reportTaskId: number;

/** Numbered screenshot + attachment, same convention as full-cycle-task.spec.ts. */
async function shot(page: Page, name: string) {
	const ss = await page.screenshot({ path: `./tests/${name}.png` });
	test.info().attach(name.replace(/^\d+-/, ""), { body: ss, contentType: "image/png" });
}

/** Sign in through the real form and persist the session cookie for later contexts. */
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

test.describe("Security regressions", () => {
	test.beforeAll(async ({ browser }) => {
		const admin = await getUserByEmail(user1email);
		const normal = await getUserByEmail(user2email);
		adminId = admin!.id;
		normalId = normal!.id;

		await createExtraUser(outsiderEmail, { firstName: "Outsider", lastName: "User" });
		await createExtraUser(resetTargetEmail, { firstName: "Reset", lastName: "Target" });

		// Assigned to the normal user, so the outsider has no route to it
		const task = await createTaskFor(normalId, adminId, securityTaskTitle);
		taskId = task.id;

		// A manager-assignee and their direct report, each with their own fixture task.
		const managerAssignee = await createExtraUser(managerAssigneeEmail, { firstName: "Mgr", lastName: "Assignee" });
		managerAssigneeId = managerAssignee.id;
		const report = await createExtraUser(reportEmail, { firstName: "Direct", lastName: "Report", managerId: managerAssigneeId });
		reportId = report.id;
		managerAssigneeTaskId = (await createTaskFor(managerAssigneeId, adminId, "***Security Fixture Task (manager-assignee)***")).id;
		reportTaskId = (await createTaskFor(reportId, adminId, "***Security Fixture Task (report)***")).id;

		await signIn(browser, user1email, adminStatePath);
		await signIn(browser, user2email, normalStatePath);
		await signIn(browser, outsiderEmail, outsiderStatePath);
		await signIn(browser, managerAssigneeEmail, managerAssigneeStatePath);
	});

	test.afterAll(async () => {
		await deleteUserByEmail(outsiderEmail);
		await deleteUserByEmail(resetTargetEmail);
		// Tasks reference their assignee/creator by FK, so drop the fixture tasks before their users.
		await deleteTaskById(managerAssigneeTaskId);
		await deleteTaskById(reportTaskId);
		await deleteUserByEmail(reportEmail);
		await deleteUserByEmail(managerAssigneeEmail);
		for (const p of [adminStatePath, normalStatePath, outsiderStatePath, preResetStatePath, managerAssigneeStatePath]) await fs.remove(p);
	});

	//
	// Attachment upload: path traversal (arbitrary file write)
	//

	test("Attachment upload rejects a traversal filename and still accepts a normal one", async ({ browser }) => {
		const context = await browser.newContext({ storageState: adminStatePath });

		await test.step("A traversal filename is neutralised, not honoured", async () => {
			// The filename is reduced to its basename rather than rejected, so the upload may well
			// succeed - what must never happen is a write outside the task's own folder.
			await context.request.post(`/api/attachments?id=${taskId}&type=source`, {
				multipart: {
					file: { name: "../../../../pwned.txt", mimeType: "text/plain", buffer: Buffer.from("owned") },
					description: "traversal attempt",
				},
			});

			// "../../../../" from test/files/attachments/<id> would land on the repo root
			const dir = attachmentsDirFor(taskId);
			for (const candidate of [path.resolve(dir, "../../../../pwned.txt"), path.resolve(dir, "../../../pwned.txt"), path.resolve(dir, "../../pwned.txt")]) {
				expect(fs.existsSync(candidate), `${candidate} must not exist`).toBe(false);
			}

			// Whatever was stored has to be a plain filename inside the task folder
			const attachments = await getAttachmentsForTask(taskId);
			for (const attachment of attachments) {
				expect(attachment.path).not.toContain("..");
				expect(attachment.path).not.toContain("/");
				expect(attachment.path).not.toContain("\\");
			}
		});

		await test.step("A filename that sanitises to nothing is rejected outright", async () => {
			const response = await context.request.post(`/api/attachments?id=${taskId}&type=source`, {
				multipart: {
					file: { name: "../../..", mimeType: "text/plain", buffer: Buffer.from("owned") },
					description: "empty after sanitising",
				},
			});
			expect(response.status()).toBe(400);
		});

		await test.step("A normal upload still works", async () => {
			const response = await context.request.post(`/api/attachments?id=${taskId}&type=source`, {
				multipart: {
					file: { name: "legit.txt", mimeType: "text/plain", buffer: Buffer.from("hello") },
					description: "legit attachment",
				},
			});
			expect(response.ok()).toBeTruthy();

			const attachments = await getAttachmentsForTask(taskId);
			expect(attachments.some((a) => a.path === "source_legit.txt")).toBe(true);
			// And it landed inside the task folder, not somewhere else
			expect(fs.existsSync(path.join(attachmentsDirFor(taskId), "source_legit.txt"))).toBe(true);
		});

		await test.step("The task shows only the sanitised attachment", async () => {
			const page = await context.newPage();
			await page.goto(`/tasks/${taskId}`);
			await page.waitForLoadState("networkidle");
			await shot(page, "23-attachments-after-traversal-attempt");
		});

		await context.close();
	});

	//
	// Attachment routes: authorization
	//

	test("A user who cannot edit the task cannot upload to it or delete its attachments", async ({ browser }) => {
		const context = await browser.newContext({ storageState: outsiderStatePath });
		const before = await getAttachmentsForTask(taskId);
		expect(before.length).toBeGreaterThan(0);

		await test.step("Upload is refused", async () => {
			const response = await context.request.post(`/api/attachments?id=${taskId}&type=source`, {
				multipart: { file: { name: "outsider.txt", mimeType: "text/plain", buffer: Buffer.from("x") }, description: "nope" },
			});
			expect(response.status()).toBe(403);
		});

		await test.step("Delete is refused and the attachment survives", async () => {
			const response = await context.request.delete(`/api/attachments/${before[0].id}/remove`);
			expect(response.status()).toBe(403);

			const after = await getAttachmentsForTask(taskId);
			expect(after.map((a) => a.id)).toContain(before[0].id);
		});

		await context.close();
	});

	test("Attachment and avatar routes are closed to anonymous callers", async ({ browser }) => {
		const context = await browser.newContext();
		const attachments = await getAttachmentsForTask(taskId);

		const attachmentResponse = await context.request.get(`/api/attachments/${attachments[0].id}`);
		expect(attachmentResponse.status()).not.toBe(200);

		const avatarResponse = await context.request.get(`/api/avatars/${adminId}`);
		expect(avatarResponse.status()).not.toBe(200);

		await context.close();
	});

	test("The dashboard is closed to anonymous callers and redirects to sign-in", async ({ browser }) => {
		const context = await browser.newContext();
		const page = await context.newPage();

		await page.goto("/");
		await expect(page).toHaveURL(/\/sign-in/);
		await shot(page, "0-dashboard-guest-redirect");

		await context.close();
	});

	//
	// User update: privilege escalation
	//

	test("A non-admin cannot grant themselves admin by injecting isAdmin", async ({ browser }) => {
		const context = await browser.newContext({ storageState: normalStatePath });
		const page = await context.newPage();

		await page.goto(`/users/${normalId}/edit`);
		await page.waitForLoadState("networkidle");

		// The checkbox is not rendered for a non-admin, so add the field the server would receive
		await page.evaluate(() => {
			const form = document.querySelector("form");
			const input = document.createElement("input");
			input.type = "hidden";
			input.name = "isAdmin";
			input.value = "on";
			form?.appendChild(input);
		});

		await page.click('button:has-text("Save User")');
		await page.waitForLoadState("networkidle");
		await page.waitForTimeout(1500);

		const normal = await getUserByEmail(user2email);
		expect(normal?.isAdmin).toBeFalsy();
		await shot(page, "24-isadmin-injection-blocked");

		await context.close();
	});

	test("A non-admin cannot edit another user by swapping the hidden id", async ({ browser }) => {
		const context = await browser.newContext({ storageState: normalStatePath });
		const page = await context.newPage();

		await page.goto(`/users/${normalId}/edit`);
		await page.waitForLoadState("networkidle");

		// Point the form at the admin's account and try to rename them.
		// This is the exact shape of the old escalation: id !== editor skipped the self-edit clamp.
		await page.locator('input[name="id"]').evaluate((el, id) => ((el as HTMLInputElement).value = id), adminId);
		await page.fill('input[name="firstName"]', "Pwned");
		await page.click('button:has-text("Save User")');
		await page.waitForLoadState("networkidle");
		await page.waitForTimeout(1500);

		const admin = await getUserByEmail(user1email);
		expect(admin?.firstName).toBe(user1firstName);
		expect(admin?.isAdmin).toBe(true);
		await shot(page, "25-user-id-swap-blocked");

		await context.close();
	});

	//
	// Department actions: they had no session check at all
	//

	test("Department actions require an admin session", async ({ browser }) => {
		// The departments page is admin-only, so a non-admin cannot even load the form. To post it
		// as someone else, load it as the admin and swap the session cookie just before submitting -
		// which is exactly what an attacker replaying the request would send.
		async function submitNewDepartment(name: string, swapSession: "none" | "normal" | "keep") {
			const context = await browser.newContext({ storageState: adminStatePath });
			const page = await context.newPage();
			await page.goto("/departments");
			await page.waitForLoadState("networkidle");
			await page.click('button:has-text("New Department")');
			await page.fill('input[name="deptName"]', name);

			if (swapSession === "none") {
				await context.clearCookies();
			} else if (swapSession === "normal") {
				const normalState = await fs.readJson(normalStatePath);
				await context.clearCookies();
				await context.addCookies(normalState.cookies);
			}

			await page.click('button:has-text("Confirm")');
			await page.waitForLoadState("networkidle");
			await page.waitForTimeout(1500);
			await shot(page, `26-departments-${swapSession}-session`);
			await context.close();
		}

		const before = await getDepartments();

		await test.step("Positive control: an admin can create a department", async () => {
			await submitNewDepartment("Control Department", "keep");
			const after = await getDepartments();
			expect(after.map((d) => d.name), "the admin submission should have worked").toContain("Control Department");
		});

		const afterControl = await getDepartments();

		await test.step("The same form posted with no session changes nothing", async () => {
			await submitNewDepartment("Anonymous Department", "none");
			const after = await getDepartments();
			expect(after.map((d) => d.name)).not.toContain("Anonymous Department");
			expect(after.length).toBe(afterControl.length);
		});

		await test.step("The same form posted by a non-admin changes nothing", async () => {
			await submitNewDepartment("Non Admin Department", "normal");
			const after = await getDepartments();
			expect(after.map((d) => d.name)).not.toContain("Non Admin Department");
			expect(after.length).toBe(afterControl.length);
		});
	});

	//
	// Password reset: the action used to trust a user id from the form
	//

	test("Password reset is driven by the token, not by a user id in the form", async ({ browser }) => {
		const target = await getUserByEmail(resetTargetEmail);

		// A session that exists before the reset, to prove it does not survive it
		await signIn(browser, resetTargetEmail, preResetStatePath);

		const context = await browser.newContext();
		const page = await context.newPage();

		await test.step("Requesting a reset issues a token", async () => {
			await page.goto("/forgot-password");
			await page.fill('input[name="email"]', resetTargetEmail);
			await page.click('button[type="submit"]');
			await page.waitForLoadState("networkidle");
			await page.waitForTimeout(1500);

			expect(await countResetTokens(target!.id)).toBeGreaterThan(0);
		});

		const token = await getLatestResetToken(target!.id);
		expect(token).toBeTruthy();

		await test.step("The form carries the token and no user id", async () => {
			await page.goto(`/password-reset?token=${token!.token}`);
			await page.waitForLoadState("networkidle");

			await expect(page.locator('input[name="token"]')).toHaveCount(1);
			// The old form posted the account to change as a hidden id - that is the whole bug
			await expect(page.locator('input[name="id"]')).toHaveCount(0);
			await shot(page, "27-password-reset-form");
		});

		const newPassword = "Rotated_Pass1!";

		await test.step("The token sets the password for its own user", async () => {
			await page.fill('input[name="newPassword"]', newPassword);
			await page.fill('input[name="confirmPassword"]', newPassword);
			await page.click('button:has-text("Save new password")');
			await expect(page.getByText("New password saved")).toBeVisible({ timeout: 15000 });
			await shot(page, "28-password-reset-saved");
		});

		await test.step("The new password works and the token is single-use", async () => {
			expect(await countResetTokens(target!.id)).toBe(0);

			// The consumed link no longer resolves
			await page.goto(`/password-reset?token=${token!.token}`);
			await expect(page.locator('input[name="newPassword"]')).toHaveCount(0);
		});

		await context.close();

		await test.step("Sessions opened before the reset are dead", async () => {
			// Password reset is the account recovery path: if it is used because the account was
			// compromised, an attacker's existing session must not survive it.
			const stale = await browser.newContext({ storageState: preResetStatePath });
			const stalePage = await stale.newPage();
			await stalePage.goto("/tasks");
			await expect(stalePage).toHaveURL(/\/sign-in/);
			await shot(stalePage, "29-session-killed-by-reset");
			await stale.close();
		});

		await test.step("Sign-in with the rotated password succeeds", async () => {
			const freshContext = await browser.newContext();
			const freshPage = await freshContext.newPage();
			await freshPage.goto("/sign-in");
			await freshPage.fill('input[name="email"]', resetTargetEmail);
			await freshPage.fill('input[name="password"]', newPassword);
			await freshPage.click('button[type="submit"]');
			await expect(freshPage).toHaveURL("/");
			await freshContext.close();
		});
	});

	//
	// Task write authorization
	//

	test("An unrelated user cannot edit someone else's task", async ({ browser }) => {
		const before = await getTaskById(taskId);

		// Load the edit form as the admin, who may edit it, then submit it carrying the outsider's
		// session. The edit page itself is gated, so this is the only way the request could be made -
		// and it is what the action has to reject on its own.
		const context = await browser.newContext({ storageState: adminStatePath });
		const page = await context.newPage();
		await page.goto(`/tasks/${taskId}/edit`);
		await page.waitForLoadState("networkidle");
		await page.fill('input[name="title"]', "Hijacked by an unrelated user");

		const outsiderState = await fs.readJson(outsiderStatePath);
		await context.clearCookies();
		await context.addCookies(outsiderState.cookies);

		await page.click('button:has-text("Save Task")');
		await page.waitForLoadState("networkidle");
		await page.waitForTimeout(1500);

		const after = await getTaskById(taskId);
		expect(after?.title).toBe(before?.title);
		await shot(page, "30-task-edit-rejected");
		await context.close();
	});

	test("The Excel export does not emit user text as live formulas", async ({ browser }) => {
		// A task title is free text. Left raw, "=..." is evaluated by Excel when the export is
		// opened - code execution aimed at whoever opens the file, not at the app.
		const payload = `=HYPERLINK("http://evil.example/${Date.now()}","click me")`;
		await createTaskFor(normalId, adminId, payload);

		const context = await browser.newContext({ storageState: adminStatePath, acceptDownloads: true });
		const page = await context.newPage();
		await page.goto("/tasks");
		await page.waitForLoadState("networkidle");

		const [download] = await Promise.all([page.waitForEvent("download"), page.click('button:has-text("Export")')]);
		const file = path.join("./tasks", "formula-check.xlsx");
		await download.saveAs(file);

		const XLSX = (await import("xlsx-js-style")).default;
		const sheet = XLSX.readFile(file).Sheets["Tasks"] ?? Object.values(XLSX.readFile(file).Sheets)[0];
		const rows: string[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

		const cell = rows.flat().find((v) => typeof v === "string" && v.includes("evil.example"));
		expect(cell, "the payload should be present in the export").toBeTruthy();
		expect(cell!.startsWith("="), "it must not still be a formula").toBe(false);
		await shot(page, "33-excel-export-formula-neutralised");

		fs.unlinkSync(file);
		await context.close();
	});

	test("A plain assignee cannot reach the edit page for their own task", async ({ browser }) => {
		// New policy: a non-manager assignee may tick checklist items on the detail page (covered in
		// subtasks.spec.ts) but may not change the task's content. The edit route 404s for them.
		const before = await getTaskById(taskId);
		const context = await browser.newContext({ storageState: normalStatePath });
		const page = await context.newPage();

		await page.goto(`/tasks/${taskId}/edit`);
		await expect(page.getByRole("heading", { name: /could not find the page/i })).toBeVisible();
		await expect(page.locator('input[name="title"]')).toHaveCount(0);

		const after = await getTaskById(taskId);
		expect(after?.title).toBe(before?.title);
		await shot(page, "32-task-edit-blocked-for-plain-assignee");
		await context.close();
	});

	test("A plain assignee's forged edit submission is rejected by updateTask", async ({ browser }) => {
		// The edit page is gated, so the only way to make the request is to load the form as someone
		// who may (the admin), then swap the session before submitting - the action must reject on its own.
		const before = await getTaskById(taskId);
		const context = await browser.newContext({ storageState: adminStatePath });
		const page = await context.newPage();
		await page.goto(`/tasks/${taskId}/edit`);
		await page.waitForLoadState("networkidle");
		await page.fill('input[name="title"]', "Edited by a plain assignee");

		const normalState = await fs.readJson(normalStatePath);
		await context.clearCookies();
		await context.addCookies(normalState.cookies);

		await page.click('button:has-text("Save Task")');
		await page.waitForLoadState("networkidle");

		await expect.poll(async () => (await getTaskById(taskId))?.title).toBe(before?.title);
		await shot(page, "34-task-edit-action-rejects-plain-assignee");
		await context.close();
	});

	test("An assignee who is also a manager can edit their own task", async ({ browser }) => {
		// canEditTask: isManager && assignee === actor. The counterpart to the blocks above - the
		// authorization fix must not lock out legitimate edits.
		const context = await browser.newContext({ storageState: managerAssigneeStatePath });
		const page = await context.newPage();
		const newTitle = "***Security Fixture Task (edited by manager-assignee)***";

		await page.goto(`/tasks/${managerAssigneeTaskId}/edit`);
		await expect(page.locator('input[name="title"]')).toBeVisible();
		await page.fill('input[name="title"]', newTitle);
		await page.click('button:has-text("Save Task")');

		await expect.poll(async () => (await getTaskById(managerAssigneeTaskId))?.title).toBe(newTitle);
		await shot(page, "35-task-edit-allowed-for-manager-assignee");
		await context.close();
	});

	test("The assignee's manager can edit the task", async ({ browser }) => {
		// canEditTask: isAssigneesManager. managerAssignee is the report's manager.
		const context = await browser.newContext({ storageState: managerAssigneeStatePath });
		const page = await context.newPage();
		const newTitle = "***Security Fixture Task (edited by assignee's manager)***";

		await page.goto(`/tasks/${reportTaskId}/edit`);
		await expect(page.locator('input[name="title"]')).toBeVisible();
		await page.fill('input[name="title"]', newTitle);
		await page.click('button:has-text("Save Task")');

		await expect.poll(async () => (await getTaskById(reportTaskId))?.title).toBe(newTitle);
		await shot(page, "36-task-edit-allowed-for-assignees-manager");
		await context.close();
	});

	// The M365 OAuth feature is off in .env.test (M365_AUTH_ENABLED is unset), which is the state
	// every deployment starts in. These lock in that "off" really means absent, not merely hidden:
	// a flag that only removes the button while leaving the endpoints live would be no flag at all.
	test("With M365 sign-in disabled the OAuth routes do not exist", async ({ context }) => {
		for (const route of ["/api/auth/m365/login", "/api/auth/m365/callback?code=x&state=y"]) {
			const res = await context.request.get(route, { maxRedirects: 0 });
			expect(res.status(), `${route} should not exist while the feature is off`).toBe(404);
			// Nothing may hand out a session on the way to a 404
			expect(res.headers()["set-cookie"] ?? "").not.toContain("auth_session=");
		}
	});

	test("With M365 sign-in disabled the sign-in page offers no Microsoft button", async ({ page }) => {
		await page.goto("/sign-in");
		await expect(page.locator('[data-testid="m365-signin"]')).toHaveCount(0);
		// The password form is still the way in
		await expect(page.locator('input[name="password"]')).toBeVisible();
	});

	test("The sign-in page will not reflect an arbitrary error code back to the user", async ({ page }) => {
		// The callback reports failures as a fixed set of codes that the page maps to messages.
		// Anything else must be ignored rather than rendered.
		await page.goto("/sign-in?error=%3Cimg%20src%3Dx%20onerror%3Dalert(1)%3E");
		await expect(page.locator("text=onerror")).toHaveCount(0);
		await expect(page.locator('input[name="password"]')).toBeVisible();
	});

	// Last, because it kills the outsider session the earlier tests rely on
	test("Deactivating a user immediately ends their session", async ({ browser }) => {
		test.setTimeout(90000);

		await test.step("The outsider's session works to begin with", async () => {
			const context = await browser.newContext({ storageState: outsiderStatePath });
			const page = await context.newPage();
			await page.goto("/tasks");
			await expect(page).toHaveURL("/tasks");
			await context.close();
		});

		await test.step("An admin deactivates them", async () => {
			const outsider = await getUserByEmail(outsiderEmail);
			const context = await browser.newContext({ storageState: adminStatePath });
			const page = await context.newPage();
			await page.goto(`/users/${outsider!.id}`);
			await page.waitForLoadState("networkidle");

			// There is no confirmation dialog - the button submits the form straight away. The
			// dialog in ToggleUserButton only ever appears to explain why a user cannot be deactivated.
			await page.click('button:has-text("Deactivate")');

			// The action revalidates rather than navigating, so poll the record itself
			await expect.poll(async () => (await getUserByEmail(outsiderEmail))?.status, { timeout: 20000 }).toBe("inactive");
			await shot(page, "31-user-deactivated");
			await context.close();
		});

		await test.step("Their existing session no longer works", async () => {
			// Nothing re-checks `active` per request, so the session has to be invalidated on deactivation
			const context = await browser.newContext({ storageState: outsiderStatePath });
			const page = await context.newPage();
			await page.goto("/tasks");
			await expect(page).toHaveURL(/\/sign-in/);
			await context.close();
		});
	});
});
