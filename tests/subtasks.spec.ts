/**
 * Coverage for sub-tasks, checklists, Duplicate and the derived progress ring.
 *
 * Named so it sorts after full-cycle-task/security/workflows, and creates its own users/tasks so
 * it neither depends on nor disturbs them - same convention as workflows.spec.ts.
 */

import { Browser, Page, expect, test } from "@playwright/test";
import fs from "fs-extra";
import {
	createChecklistItems,
	createExtraUser,
	createTaskFor,
	createTaskWith,
	getChecklistItems,
	getChildren,
	getTaskById,
	getUserByEmail,
	stEmployeeEmail,
	stManagerEmail,
	usersPass,
} from "./tests-setup";

test.describe.configure({ mode: "serial" });

const managerStatePath = "./tests/st-manager-state.json";
const employeeStatePath = "./tests/st-employee-state.json";

// A dedicated manager/employee pair, seeded in globalSetup (createSubtaskUsers) rather than created
// here - getUsers() caches its result for 5 minutes, so a user created in this file's own beforeAll
// would not appear in the assignee dropdown yet. Kept separate from wfManager/wfEmployee so this
// file's many fixture tasks cannot affect workflows.spec.ts's pagination-sensitive assertions.
const managerEmail = stManagerEmail;
const employeeEmail = stEmployeeEmail;
const outsiderEmail = "st-outsider@resend.dev";

let managerId: string;
let employeeId: string;

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

async function shot(page: Page, name: string) {
	const ss = await page.screenshot({ path: `./tests/${name}.png` });
	test.info().attach(name.replace(/^\d+-/, ""), { body: ss, contentType: "image/png" });
}

async function settle(page: Page) {
	await page.waitForLoadState("networkidle");
	await page.waitForTimeout(500);
}

/** Fills the DatePicker with a date safely in the future - the exact date does not matter here. */
async function pickFutureDueDate(page: Page) {
	await page.click('button:has-text("Pick a date")');
	await page.click('[aria-label="Go to the Next Month"]');
	await page.click('button:has-text("15")');
}

async function pickAssignee(page: Page, firstName: string) {
	await page.click('text="Select a user..."');
	await page.waitForSelector('div[role="listbox"]', { state: "visible" });
	await page.locator('div[role="listbox"]').locator(`text=${firstName}`).click();
}

test.describe("Sub-tasks, checklists and progress", () => {
	test.beforeAll(async () => {
		const manager = await getUserByEmail(managerEmail);
		const employee = await getUserByEmail(employeeEmail);
		if (!manager || !employee) throw new Error("Expected stManager/stEmployee to already exist from globalSetup");
		await createExtraUser(outsiderEmail, { firstName: "St", lastName: "Outsider" });
		managerId = manager.id;
		employeeId = employee.id;
	});

	test.afterAll(async () => {
		for (const p of [managerStatePath, employeeStatePath]) await fs.remove(p);
	});

	test("Manager and employee sign-in", async ({ browser }) => {
		await signIn(browser, managerEmail, managerStatePath);
		await signIn(browser, employeeEmail, employeeStatePath);
	});

	test("Add sub-task pre-fills the parent field, and the parent shows a progress ring once children exist", async ({ browser }) => {
		const parent = await createTaskFor(employeeId, managerId, "***Subtask Parent Task***");

		const context = await browser.newContext({ storageState: managerStatePath });
		const page = await context.newPage();

		await page.goto(`/tasks/${parent.id}`);
		await page.click('a:has-text("Add sub-task")');
		await expect(page).toHaveURL(/\/tasks\/new\?parent=/);

		await page.fill('input[name="title"]', "***Subtask For Vessel A***");
		await page.fill('textarea[name="description"]', "Sub-task fixture description, well over the minimum length required.");
		await pickFutureDueDate(page);
		await pickAssignee(page, "St Employee");
		await page.click('button:has-text("Create Task")');
		await settle(page);

		await shot(page, "51-subtask-created");

		const created = await getChildren(parent.id);
		expect(created.length).toBe(1);
		expect(created[0].parentId).toBe(parent.id);

		await page.goto(`/tasks/${parent.id}`);
		await expect(page.locator('[data-testid="subtasks-list"]')).toBeVisible();
		// The parent's own aggregate progress is a bar (see ProgressBar), not a ring - the ring is
		// reserved for the tasks table and for a child's own progress within the sub-tasks list.
		await expect(page.locator('[data-testid="progress-bar"]')).toBeVisible();

		await context.close();
	});

	test("A parent cannot be completed while a sub-task is still open", async ({ browser }) => {
		const parent = await createTaskFor(employeeId, managerId, "***Blocked Complete Parent***");
		await createTaskWith({ assignedToUserId: employeeId, createdByUserId: managerId, title: "***Blocked Complete Child***", parentId: parent.id });

		const context = await browser.newContext({ storageState: employeeStatePath });
		const page = await context.newPage();
		await page.goto(`/tasks/${parent.id}`);

		// The Complete button is replaced by a disabled "N sub-task(s) open" indicator - see page.tsx
		await expect(page.locator('button:has-text("sub-task")')).toBeVisible();
		await expect(page.getByRole("button", { name: "Complete Task" })).toHaveCount(0);

		await shot(page, "52-parent-complete-blocked");
		await context.close();
	});

	test("A cancelled sub-task does not count against the parent's progress", async ({ browser }) => {
		const parent = await createTaskFor(employeeId, managerId, "***Progress With Cancelled Child***");
		await createTaskWith({ assignedToUserId: employeeId, createdByUserId: managerId, title: "***Done Child A***", parentId: parent.id, statusId: 2, completedOn: new Date() });
		await createTaskWith({ assignedToUserId: employeeId, createdByUserId: managerId, title: "***Cancelled Child B***", parentId: parent.id, statusId: 4 });

		const context = await browser.newContext({ storageState: managerStatePath });
		const page = await context.newPage();
		await page.goto(`/tasks/${parent.id}`);

		// 1 completed / 1 non-cancelled child = 100%, not 50%
		await expect(page.locator('[data-testid="progress-bar"][data-percent="100"]')).toBeVisible();

		await shot(page, "53-progress-excludes-cancelled");
		await context.close();
	});

	test("Reopening a sub-task is refused while its parent is completed or closed", async ({ browser }) => {
		const parent = await createTaskWith({ assignedToUserId: employeeId, createdByUserId: managerId, title: "***Closed Parent Blocks Reopen***", statusId: 3 });
		const child = await createTaskWith({
			assignedToUserId: employeeId,
			createdByUserId: managerId,
			title: "***Child Of Closed Parent***",
			parentId: parent.id,
			statusId: 2,
			completedOn: new Date(),
		});

		const context = await browser.newContext({ storageState: managerStatePath });
		const page = await context.newPage();
		await page.goto(`/tasks/${child.id}`);

		// The child was completed, so Reopen would normally show for its manager - it must not here
		await expect(page.getByRole("button", { name: "Reopen Task" })).toHaveCount(0);
		await expect(page.locator("text=must be reopened before this one can be")).toBeVisible();

		const stillCompleted = await getTaskById(child.id);
		expect(stillCompleted?.statusId).toBe(2);

		await shot(page, "54-reopen-blocked-by-parent");
		await context.close();
	});

	test("Checklist items can be added on the edit page and ticked on the detail page, with attribution", async ({ browser }) => {
		const task = await createTaskFor(employeeId, managerId, "***Checklist Task***");

		const managerContext = await browser.newContext({ storageState: managerStatePath });
		const managerPage = await managerContext.newPage();
		await managerPage.goto(`/tasks/${task.id}/edit`);

		await managerPage.fill('input[placeholder*="checklist item"]', "MV Example One");
		await managerPage.click('[data-testid="checklist-add-button"]');
		await managerPage.fill('input[placeholder*="checklist item"]', "MV Example Two");
		await managerPage.click('[data-testid="checklist-add-button"]');
		await managerPage.click('button:has-text("Save Task")');
		await settle(managerPage);

		const items = await getChecklistItems(task.id);
		expect(items.length).toBe(2);
		await managerContext.close();

		const employeeContext = await browser.newContext({ storageState: employeeStatePath });
		const employeePage = await employeeContext.newPage();
		await employeePage.goto(`/tasks/${task.id}`);
		await employeePage.locator('[data-testid="checklist-item"] button[role="checkbox"]').first().click();
		await settle(employeePage);

		await expect(employeePage.locator('[data-testid="checklist-item-completed-by"]').first()).toContainText("St completed on");

		const updated = await getChecklistItems(task.id);
		expect(updated.find((i) => i.id === items[0].id)?.done).toBe(true);
		expect(updated.find((i) => i.id === items[0].id)?.completedById).toBe(employeeId);

		await shot(employeePage, "55-checklist-ticked");
		await employeeContext.close();
	});

	test("Someone outside the task can see its checklist but cannot tick it - client or server side", async ({ browser }) => {
		const task = await createTaskFor(employeeId, managerId, "***Checklist Permission Task***");
		await createChecklistItems(task.id, ["Only assignee or manager may tick this"]);

		const outsiderContext = await browser.newContext();
		const outsiderPage = await outsiderContext.newPage();
		await outsiderPage.goto("/sign-in");
		await outsiderPage.fill('input[name="email"]', outsiderEmail);
		await outsiderPage.fill('input[name="password"]', usersPass);
		await outsiderPage.click('button[type="submit"]');
		await expect(outsiderPage).toHaveURL("/");

		// The task itself has no viewer-scoping gate (same as its description and comments), but the
		// checkbox must be disabled - canToggleChecklist is false for an unrelated user. The action
		// behind it (toggleChecklistItem.ts) re-checks the same rule server-side regardless of the
		// disabled attribute, so this disabled state is not merely cosmetic.
		await outsiderPage.goto(`/tasks/${task.id}`);
		await expect(outsiderPage.locator('[data-testid="checklist-item"] button[role="checkbox"]').first()).toBeDisabled();

		const unchanged = await getChecklistItems(task.id);
		expect(unchanged[0].done).toBe(false);

		await outsiderContext.close();
	});

	test("Duplicate copies title, description and checklist, but not status or history", async ({ browser }) => {
		const source = await createTaskFor(employeeId, managerId, "***Duplicate Source Task***");
		await createChecklistItems(source.id, ["MV Copy One", "MV Copy Two"]);

		const context = await browser.newContext({ storageState: managerStatePath });
		const page = await context.newPage();
		await page.goto(`/tasks/${source.id}`);
		await page.click('a:has-text("Duplicate")');
		await expect(page).toHaveURL(/\/tasks\/new\?copyFrom=/);

		await expect(page.locator('input[name="title"]')).toHaveValue("***Duplicate Source Task***");
		await expect(page.locator('[data-testid="checklist-editor-item"]')).toHaveCount(2);
		// createTaskFor's due date is 30 days out, so it is still in the future and gets copied -
		// no "Pick a date" placeholder to click here (see the separate past-due-date coverage note).
		await expect(page.locator('button:has-text("Pick a date")')).toHaveCount(0);

		await page.click('button:has-text("Create Task")');
		await settle(page);

		const newId = Number(page.url().match(/\/tasks\/(\d+)/)?.[1]);
		expect(newId).toBeGreaterThan(0);

		const copiedItems = await getChecklistItems(newId);
		expect(copiedItems.map((i) => i.text).sort()).toEqual(["MV Copy One", "MV Copy Two"]);
		expect(copiedItems.every((i) => !i.done)).toBe(true);

		const copiedTask = await getTaskById(newId);
		expect(copiedTask?.statusId).toBe(1);
		expect(copiedTask?.completedOn).toBeNull();

		await shot(page, "56-task-duplicated");
		await context.close();
	});

	test("Duplicating a task with a past due date leaves the date blank and warns", async ({ browser }) => {
		const pastDue = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
		const source = await createTaskWith({ assignedToUserId: employeeId, createdByUserId: managerId, title: "***Overdue Duplicate Source***", dueDate: pastDue });

		const context = await browser.newContext({ storageState: managerStatePath });
		const page = await context.newPage();
		await page.goto(`/tasks/new?copyFrom=${source.id}`);

		await expect(page.locator('button:has-text("Pick a date")')).toBeVisible();
		await expect(page.locator("text=due date had passed")).toBeVisible();

		// Submitting without picking a new date is rejected, not silently accepted with a stale one
		await page.click('button:has-text("Create Task")');
		await settle(page);
		await expect(page.locator("text=Due date is required")).toBeVisible();

		await shot(page, "58-duplicate-past-due-date-blank");
		await context.close();
	});

	test("The parent task selector excludes finished tasks and tasks that are already someone's child", async ({ browser }) => {
		const closedTask = await createTaskWith({ assignedToUserId: employeeId, createdByUserId: managerId, title: "***Closed Not A Parent Option***", statusId: 3 });
		const openTask = await createTaskFor(employeeId, managerId, "***Open Parent Option***");
		const alreadyChild = await createTaskWith({ assignedToUserId: employeeId, createdByUserId: managerId, title: "***Already A Child***", parentId: openTask.id });

		const context = await browser.newContext({ storageState: managerStatePath });
		const page = await context.newPage();
		await page.goto("/tasks/new");

		await page.click('text="No parent task"');
		await page.waitForSelector('div[role="listbox"]', { state: "visible" });
		const listbox = page.locator('div[role="listbox"]');

		// Full "#id - title" text, not a bare id - ids are small integers here and a bare id could
		// be a substring of another task's id in the same run (e.g. "1" inside "12").
		await expect(listbox.getByText(`#${openTask.id} - ${openTask.title}`)).toBeVisible();
		await expect(listbox.getByText(closedTask.title)).toHaveCount(0);
		await expect(listbox.getByText(alreadyChild.title)).toHaveCount(0);

		await context.close();
	});

	test("The tasks list hierarchy filter can hide sub-tasks", async ({ browser }) => {
		const parent = await createTaskFor(employeeId, managerId, "***Hierarchy Filter Parent***");
		const child = await createTaskWith({ assignedToUserId: employeeId, createdByUserId: managerId, title: "***Hierarchy Filter Child***", parentId: parent.id });

		const context = await browser.newContext({ storageState: managerStatePath });
		const page = await context.newPage();
		await page.goto("/tasks?status=1%2C5%2C2%2C3%2C4&search=Hierarchy+Filter");
		await expect(page.locator(`text=${child.title}`)).toBeVisible();

		await page.click('button:has-text("All tasks")');
		await page.click('div[role="menuitemradio"]:has-text("Hide sub-tasks")');
		await settle(page);

		await expect(page.locator(`text=${child.title}`)).toHaveCount(0);
		await expect(page.locator(`text=${parent.title}`)).toBeVisible();

		await shot(page, "57-hierarchy-filter-hides-subtasks");
		await context.close();
	});
});
