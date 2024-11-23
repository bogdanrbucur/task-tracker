import { expect, test } from "@playwright/test";
import {
	createTaskStatuses,
	createTestUser,
	deleteExistingScreenshots,
	deleteTestDb,
	storageStatePath,
	taskClosingComment,
	taskCompletionComment,
	taskDescription,
	taskTitle,
	testAttachmentDescription,
	testAttachmentPath,
	user1email,
	user1firstName,
	user1lastName,
	user2email,
	user2firstName,
	user2lastName,
	usersPass,
} from "./tests-setup";

test.beforeAll(async () => {
	await deleteExistingScreenshots();
	await createTestUser();
	await createTaskStatuses();
});

// Clean up the database after all tests
test.afterAll(async () => {
	await deleteTestDb();
});

test.describe("Task creation and closing", () => {
	test("Admin user sign-in", async ({ page }) => {
		await page.goto("/sign-in");
		await page.fill('input[name="email"]', user1email);
		await page.fill('input[name="password"]', usersPass);
		await page.screenshot({ path: "./tests/0-sign-in.png" });
		await page.click('button[type="submit"]');
		await expect(page).toHaveURL("/");
		await expect(page.getByTestId("firstName")).toContainText(user1firstName);
		await page.screenshot({ path: "./tests/1-dashboard.png" });

		// Save the storage state
		await page.context().storageState({ path: storageStatePath });
	});

	test("Create new task", async ({ browser }) => {
		const context = await browser.newContext({ storageState: storageStatePath });
		const page = await context.newPage();

		await page.goto("/tasks/new");
		await page.fill('input[name="title"]', taskTitle);
		await page.fill('textarea[name="description"]', taskDescription);
		await page.click('button:has-text("Pick a date")');
		while (!(await page.locator('text="December 2026"').isVisible())) await page.click('[aria-label="Go to next month"]');
		await page.screenshot({ path: "./tests/2-task-creation.png" });
		await page.click('button:has-text("31")');
		const dueDateInput = page.locator('input[name="dueDate"]');
		const value = await dueDateInput.inputValue();
		expect(value).toContain("2026-12-31");
		await page.click('text="Select a user..."');
		await page.waitForSelector('div[role="listbox"]', { state: "visible" });
		await page.locator('div[role="listbox"]').locator(`text=${user2firstName}`).click();
		await page.click('button:has-text("Create Task")');
		await page.waitForLoadState("networkidle");
		await page.screenshot({ path: "./tests/3-new-task.png" });
		await page.goto("/tasks");
		await expect(page).toHaveURL("/tasks");
		await expect(page.getByText(taskTitle)).toContainText(taskTitle);
		await context.close();
	});

	test("Add task comment", async ({ browser }) => {
		const context = await browser.newContext({ storageState: storageStatePath });
		const page = await context.newPage();

		await page.goto("/tasks");
		await expect(page).toHaveURL("/tasks");
		const taskTitleElement = page.locator(`text=${taskTitle}`);
		await expect(taskTitleElement).toBeVisible();
		await page.waitForLoadState("networkidle");
		await page.screenshot({ path: "./tests/4-tasks-list.png" });
		await page.waitForTimeout(300);
		await taskTitleElement.click();
		await page.waitForURL(/\/tasks\/\d+/);
		await page.waitForLoadState("networkidle");
		await page.waitForTimeout(1000);
		await page.screenshot({ path: "./tests/5-task-view.png" });
		await expect(page).toHaveURL(/\/tasks\/\d+/);

		await page.waitForSelector('textarea[name="comment"]');
		const commentTextarea = page.locator('textarea[name="comment"]');
		await commentTextarea.focus();
		await commentTextarea.fill(`This is a test comment @${user2firstName}`);
		await page.waitForSelector('[data-testid="users-mentions-list"]');
		await page.screenshot({ path: "./tests/6-comment-users.png" });
		await page.waitForTimeout(300);
		await page.click(`li:has-text("${user2firstName}")`);
		await page.click('button:has-text("Post Comment")');
		await page.waitForLoadState("networkidle");
		await page.waitForTimeout(1000);
		const commentLocator = page.locator(`[data-testid="user-comment"]`);
		await expect(commentLocator).toContainText(`@${user2firstName}`);
		await page.screenshot({ path: "./tests/7-task-view.png" });
		await context.close();
	});

	test("Assign manager to Normal user", async ({ browser }) => {
		const context = await browser.newContext({ storageState: storageStatePath });
		const page = await context.newPage();

		await page.goto("/users");
		await page.waitForLoadState("networkidle");
		await page.waitForTimeout(2000);
		await page.screenshot({ path: "./tests/8-users-list.png" });

		// Update the selector to target the `a` element containing the `small` tag with the text
		// ! BUG HERE: The selector is not working as expected
		const user2Element = page.locator(`a:has(small:has-text("${user2firstName} ${user2lastName}"))`);
		await user2Element.click();
		await page.waitForLoadState("networkidle");
		await page.waitForTimeout(2000);
		await page.screenshot({ path: "./tests/9-user-details.png" });

		await page.click('button:has-text("Edit")');
		await page.waitForLoadState("networkidle");
		await page.waitForTimeout(2000);
		await page.screenshot({ path: "./tests/10-user-edit.png" });

		await page.click('text="Select a user..."');
		await page.waitForSelector('div[role="listbox"]', { state: "visible" });
		await page.locator('div[role="listbox"]').locator(`text=${user1firstName}`).click();
		await page.click('button:has-text("Save User")');
		await page.waitForLoadState("networkidle");
		await page.waitForTimeout(2000);
		await page.screenshot({ path: "./tests/11-user-updated.png" });
		await context.close();
	});

	test("Admin user sign-out", async ({ browser }) => {
		const context = await browser.newContext({ storageState: storageStatePath });
		const page = await context.newPage();

		await page.goto("/");
		await expect(page.getByTestId("signout-button")).toBeVisible();
		await page.click('button[type="submit"]:has-text("Sign Out")');
		await expect(page).toHaveURL("/sign-in");
		await page.waitForLoadState("networkidle");
		await page.screenshot({ path: "./tests/12-sign-out.png" });
		await context.close();
	});

	test("Normal user sign-in", async ({ page }) => {
		await page.goto("/sign-in");
		await page.fill('input[name="email"]', user2email);
		await page.fill('input[name="password"]', usersPass);
		await page.click('button[type="submit"]');
		await expect(page).toHaveURL("/");
		await expect(page.getByTestId("firstName")).toContainText(user2firstName);
		await page.context().storageState({ path: storageStatePath });
	});

	test("Dashboard shows pending task", async ({ browser }) => {
		const context = await browser.newContext({ storageState: storageStatePath });
		const page = await context.newPage();

		await page.goto("/");
		await page.waitForLoadState("networkidle");
		await page.waitForTimeout(2000);
		await page.screenshot({ path: "./tests/13-dashboard.png" });
		await expect(page.locator('div[id="status-chart"] g.recharts-layer.recharts-pie')).toBeVisible();
		await expect(page.locator('div[id="my-tasks"]')).toContainText(taskTitle);
		await context.close();
	});

	test("Complete task", async ({ browser }) => {
		const context = await browser.newContext({ storageState: storageStatePath });
		const page = await context.newPage();

		await page.goto("/");
		const taskTitleElement = page.locator(`text=${taskTitle}`);
		await taskTitleElement.click();
		expect(page).toHaveURL(/\/tasks\/\d+/);
		await page.waitForLoadState("networkidle");
		await page.waitForTimeout(500);

		const completeButton = page.locator('button:has-text("Complete")');
		expect(completeButton).toBeVisible();
		await completeButton.click();
		await page.waitForLoadState("networkidle");
		await page.waitForTimeout(500);
		await page.screenshot({ path: "./tests/14-task-completion.png" });

		const commentLocator = page.locator(`[name="completeComment"]`);
		await expect(commentLocator).toBeVisible();
		const fileInput = page.locator("input[type=file]");
		await expect(fileInput).toBeVisible();
		const attachmentDescription = page.locator('input[name="newDescription"]');
		await expect(attachmentDescription).toBeVisible();
		const attachmentAddButton = page.locator('button:has-text("Add")');
		await expect(attachmentAddButton).toBeVisible();
		const attRemoveButton = page.locator('button:has-text("Remove")');

		await commentLocator.fill(taskCompletionComment);
		await fileInput.setInputFiles(testAttachmentPath);
		await attachmentDescription.fill(testAttachmentDescription);
		await attachmentAddButton.click();
		await page.waitForLoadState("networkidle");
		await page.waitForTimeout(2000);
		const addedAttDescription = page.locator(`input[type="text"][disabled][value="${testAttachmentDescription}"]`);
		await expect(addedAttDescription).toHaveValue(testAttachmentDescription);
		expect(attRemoveButton).toBeVisible();
		await page.screenshot({ path: "./tests/15-task-completion.png" });

		const confirmButton = page.locator('button:has-text("Confirm")');
		await confirmButton.click();
		await page.waitForLoadState("networkidle");
		await page.waitForTimeout(2000);
		await page.screenshot({ path: "./tests/16-task-completed.png" });
		await expect(page.getByTestId("completion-attachment")).toContainText(testAttachmentDescription);
		await context.close();
	});

	test("Task history updated with completion", async ({ browser }) => {
		const context = await browser.newContext({ storageState: storageStatePath });
		const page = await context.newPage();

		await page.goto("/");
		const taskTitleElement = page.locator(`text=${taskTitle}`);
		await taskTitleElement.click();
		expect(page).toHaveURL(/\/tasks\/\d+/);
		await page.waitForLoadState("networkidle");
		await page.waitForTimeout(500);

		await expect(page.locator('div[class="rounded-lg border bg-card text-card-foreground shadow-sm"]')).toContainText(
			`Task completed by ${user2firstName} ${user2lastName}: ${taskCompletionComment}`
		);
		await context.close();
	});

	test("Task status updated to Pending Review", async ({ browser }) => {
		const context = await browser.newContext({ storageState: storageStatePath });
		const page = await context.newPage();

		await page.goto("/");
		const taskTitleElement = page.locator(`text=${taskTitle}`);
		await taskTitleElement.click();
		expect(page).toHaveURL(/\/tasks\/\d+/);
		await page.waitForLoadState("networkidle");
		await page.waitForTimeout(500);

		await expect(page.locator('[data-testid="status-badge"]')).toContainText("Pending Review");
		await context.close();
	});

	test("Normal user sign-out", async ({ browser }) => {
		const context = await browser.newContext({ storageState: storageStatePath });
		const page = await context.newPage();

		await page.goto("/");
		await expect(page.getByTestId("signout-button")).toBeVisible();
		await page.click('button[type="submit"]:has-text("Sign Out")');
		await expect(page).toHaveURL("/sign-in");
		await context.close();
	});

	test("Admin user sign-in second time", async ({ page }) => {
		await page.goto("/sign-in");
		await page.fill('input[name="email"]', user1email);
		await page.fill('input[name="password"]', usersPass);
		await page.click('button[type="submit"]');
		await expect(page).toHaveURL("/");
		await expect(page.getByTestId("firstName")).toContainText(user1firstName);
		await page.context().storageState({ path: storageStatePath });
	});

	test("Dashboard shows task Pending Review", async ({ browser }) => {
		const context = await browser.newContext({ storageState: storageStatePath });
		const page = await context.newPage();

		await page.goto("/");
		await page.waitForLoadState("networkidle");
		await page.waitForTimeout(2000);
		await page.screenshot({ path: "./tests/17-dashboard.png" });
		await expect(page.locator('div[id="status-chart"] g.recharts-layer.recharts-pie')).toBeVisible();
		await expect(page.locator('div[id="my-tasks"]')).toContainText(taskTitle);
		await expect(page.locator('[data-testid="status-badge"]')).toContainText("Pending Review");
		await context.close();
	});

	test("Download task completion attachment", async ({ browser }) => {
		const context = await browser.newContext({ storageState: storageStatePath });
		const page = await context.newPage();

		await page.goto("/");
		const taskTitleElement = page.locator(`text=${taskTitle}`);
		await taskTitleElement.click();
		expect(page).toHaveURL(/\/tasks\/\d+/);
		await page.waitForLoadState("networkidle");
		await page.waitForTimeout(500);

		const downloadButton = page.getByTestId("completion-attachment");
		expect(downloadButton).toBeVisible();
		await downloadButton.click();
		// Expect to receive the file download
		const download = await page.waitForEvent("download");
		// Expect the downloaded file to be the test file
		expect(download.suggestedFilename()).toBe("completion_test-att.txt");
		await page.waitForTimeout(2000);
		await page.screenshot({ path: "./tests/18-task-attachment-download.png" });
		await context.close();
	});

	test("Close task as Admin User", async ({ browser }) => {
		const context = await browser.newContext({ storageState: storageStatePath });
		const page = await context.newPage();

		await page.goto("/");
		const taskTitleElement = page.locator(`text=${taskTitle}`);
		await taskTitleElement.click();
		expect(page).toHaveURL(/\/tasks\/\d+/);
		await page.waitForLoadState("networkidle");
		await page.waitForTimeout(500);

		const closeTaskButton = page.locator('button:has-text("Close")');
		expect(closeTaskButton).toBeVisible();
		await closeTaskButton.click();
		await page.waitForLoadState("networkidle");
		await page.waitForTimeout(500);
		await page.screenshot({ path: "./tests/19-task-closure.png" });

		const commentLocator = page.locator(`[name="closeComment"]`);
		await expect(commentLocator).toBeVisible();
		await commentLocator.fill(taskClosingComment);
		await page.waitForLoadState("networkidle");
		await page.waitForTimeout(2000);
		await page.screenshot({ path: "./tests/20-task-closure.png" });

		const confirmButton = page.locator('button:has-text("Confirm")');
		await confirmButton.click();
		await page.waitForLoadState("networkidle");
		await page.waitForTimeout(2000);

		// Check the task status
		await expect(page.locator('[data-testid="status-badge"]')).toContainText("Closed");

		// Check the task history
		await expect(page.locator('div[class="rounded-lg border bg-card text-card-foreground shadow-sm"]')).toContainText(
			`Task closed by ${user1firstName} ${user1lastName}: ${taskClosingComment}`
		);

		await page.screenshot({ path: "./tests/21-task-closed.png" });
		await context.close();
	});
});
