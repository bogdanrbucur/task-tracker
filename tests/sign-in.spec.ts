import { expect, test } from "@playwright/test";
import {
	createTaskStatuses,
	createTestUser,
	deleteTestDb,
	taskCompletionComment,
	taskDescription,
	taskTitle,
	testAttachmentDescription,
	testAttachmentPath,
	user1email,
	user1firstName,
	user2email,
	user2firstName,
	usersPass,
} from "./tests-setup";

test.beforeAll(async () => {
	await createTestUser();
	await createTaskStatuses();
});

// Clean up the database after all tests
test.afterAll(async () => {
	await deleteTestDb();
});

test.describe("Task creation and closing", () => {
	let storageStatePath = "storageState.json";

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
		// Use the saved storage state
		const context = await browser.newContext({ storageState: storageStatePath });
		const page = await context.newPage();

		await page.goto("/tasks/new");
		await page.fill('input[name="title"]', taskTitle);
		await page.fill('textarea[name="description"]', taskDescription);

		// Open the datepicker by clicking the "Pick a date" button and select 31 Dec 2025
		await page.click('button:has-text("Pick a date")');
		// Click Next Month until month and year are visible
		while (!(await page.locator('text="December 2026"').isVisible())) await page.click('[aria-label="Go to next month"]');
		await page.screenshot({ path: "./tests/2-task-creation.png" });
		await page.click('button:has-text("31")');
		const dueDateInput = page.locator('input[name="dueDate"]');
		const value = await dueDateInput.inputValue();
		expect(value).toContain("2026-12-31");

		// Select the user
		await page.click('text="Select a user..."'); // Open the dropdown
		// Wait for the dropdown options container to appear (scope to the dropdown container)
		await page.waitForSelector('div[role="listbox"]', { state: "visible" });
		// Select the desired user by partial or exact text within the dropdown container
		await page.locator('div[role="listbox"]').locator(`text=${user2firstName}`).click();
		await page.click('button:has-text("Create Task")');
		await page.waitForLoadState("networkidle");
		await page.screenshot({ path: "./tests/3-new-task.png" });
		await page.goto("/tasks");
		await expect(page).toHaveURL("/tasks");
		await expect(page.getByText(taskTitle)).toContainText(taskTitle);
		// Close the browser context
		await context.close();
	});

	test("Add task comment", async ({ browser }) => {
		// Use the saved storage state
		const context = await browser.newContext({ storageState: storageStatePath });
		const page = await context.newPage();

		await page.goto("/tasks");
		await expect(page).toHaveURL("/tasks");

		// Wait for the task title to be visible and assert its visibility
		const taskTitleElement = page.locator(`text=${taskTitle}`);
		await expect(taskTitleElement).toBeVisible();
		// Wait for the page to be fully loaded
		await page.waitForLoadState("networkidle");
		await page.screenshot({ path: "./tests/4-tasks-list.png" });
		await page.waitForTimeout(300);
		// Click the task title to navigate to the task page
		await taskTitleElement.click();
		await page.waitForURL(/\/tasks\/\d+/);
		await page.waitForLoadState("networkidle");
		await page.waitForTimeout(1000);

		await page.screenshot({ path: "./tests/5-task-view.png" });

		// Expect the URL to contain the task ID
		await expect(page).toHaveURL(/\/tasks\/\d+/);

		await page.waitForSelector('textarea[name="comment"]');
		const commentTextarea = page.locator('textarea[name="comment"]');
		await commentTextarea.focus();

		// Type a comment with @ to trigger mention dropdown
		await commentTextarea.fill(`This is a test comment @${user2firstName}`);
		// Wait for the mentions list to appear
		await page.waitForSelector('[data-testid="users-mentions-list"]');
		await page.screenshot({ path: "./tests/6-comment-users.png" });
		await page.waitForTimeout(300);
		await page.click(`li:has-text("${user2firstName}")`);

		await page.click('button:has-text("Post Comment")');
		await page.waitForLoadState("networkidle");
		await page.waitForTimeout(1000);

		// Verify the user's mention appears in the comments section
		const commentLocator = page.locator(`[data-testid="user-comment"]`);
		await expect(commentLocator).toContainText(`@${user2firstName}`);
		await page.screenshot({ path: "./tests/7-task-view.png" });

		// Close the browser context
		await context.close();
	});

	test("Admin user sign-out", async ({ browser }) => {
		// Use the saved storage state
		const context = await browser.newContext({ storageState: storageStatePath });
		const page = await context.newPage();

		// Navigate to the dashboard
		await page.goto("/");
		// Click on button of type submit with text Sign Out
		await expect(page.getByTestId("signout-button")).toBeVisible();
		await page.click('button[type="submit"]:has-text("Sign Out")');

		await expect(page).toHaveURL("/sign-in");
		await page.waitForLoadState("networkidle");
		await page.screenshot({ path: "./tests/8-sign-out.png" });

		// Close the browser context
		await context.close();
	});

	test("Normal user sign-in", async ({ page }) => {
		await page.goto("/sign-in");
		await page.fill('input[name="email"]', user2email);
		await page.fill('input[name="password"]', usersPass);
		await page.click('button[type="submit"]');
		await expect(page).toHaveURL("/");
		await expect(page.getByTestId("firstName")).toContainText(user2firstName);

		// Save the storage state
		await page.context().storageState({ path: storageStatePath });
	});

	test("Complete task visible in dashboard", async ({ browser }) => {
		// Use the saved storage state
		const context = await browser.newContext({ storageState: storageStatePath });
		const page = await context.newPage();

		// Navigate to the dashboard
		await page.goto("/");
		await page.waitForLoadState("networkidle");
		await page.waitForTimeout(2000);
		await page.screenshot({ path: "./tests/9-dashboard.png" });

		// Expect that under the <div> with id status-chart there will be <g> with class="recharts-layer recharts-pie"
		await expect(page.locator('div[id="status-chart"] g.recharts-layer.recharts-pie')).toBeVisible();

		// Expect an h4 under a div with id my-tasks to have the task title
		await expect(page.locator('div[id="my-tasks"]')).toContainText(taskTitle);
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
		await page.screenshot({ path: "./tests/10-task-completion.png" });

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
		await page.screenshot({ path: "./tests/10-task-completion.png" });

		const confirmButton = page.locator('button:has-text("Confirm")');
		await confirmButton.click();
		await page.waitForLoadState("networkidle");
		await page.waitForTimeout(2000);

		await page.screenshot({ path: "./tests/11-task-completed.png" });
		await expect(page.getByTestId("completion-attachment")).toContainText(testAttachmentDescription);

		// TODO check for the completion task history
		//

		// TODO check status to be Pending Review
		//

		// Close the browser context
		await context.close();
	});

	// TODO Seventh test: Sign out as user2
	//

	// TODO Eighth test: Sign in as user1
	//

	// TODO Ninth test: Close the task created by user1
	//
});
