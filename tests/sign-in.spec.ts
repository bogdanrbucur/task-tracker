import { expect, test } from "@playwright/test";
import {
	createTaskStatuses,
	createTestUser,
	deleteTestDb,
	taskComment,
	taskDescription,
	taskTitle,
	user1email,
	user1firstName,
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
		await page.click('button[type="submit"]');
		await expect(page).toHaveURL("/");
		await expect(page.getByTestId("firstName")).toContainText(user1firstName);

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
		while (!(await page.locator('text="December 2025"').isVisible())) await page.click('[aria-label="Go to next month"]');
		await page.click('button:has-text("31")');
		const dueDateInput = await page.locator('input[name="dueDate"]');
		const value = await dueDateInput.inputValue();
		expect(value).toContain("2025-12-31");

		// Select the user
		await page.click('text="Select a user..."'); // Open the dropdown
		// Wait for the dropdown options container to appear (scope to the dropdown container)
		await page.waitForSelector('div[role="listbox"]', { state: "visible" });
		// Select the desired user by partial or exact text within the dropdown container
		await page.locator('div[role="listbox"]').locator(`text=${user2firstName}`).click();
		await page.click('button:has-text("Create Task")');
		await page.goto("/tasks");
		await expect(page).toHaveURL("/tasks");
		await expect(page.getByText(taskTitle)).toContainText(taskTitle);
		// Close the browser context
		await context.close();
	});

	// TODO Third test: Write a comment to user2
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
		// Click on the <a> element with taskTitle text and wait for URL to change
		await taskTitleElement.click();
		await page.waitForLoadState("networkidle");

		//! Take a screenshot of the page
		await page.screenshot({ path: "task.png" });

		// Expect the URL to contain the task ID
		await expect(page).toHaveURL(/\/tasks\/\d+/);

		// Ensure the textarea is visible and interactable
		await page.waitForSelector('textarea[name="comment"]');
		const commentTextarea = page.locator('textarea[name="comment"]');

		await commentTextarea.focus();
		// Type a comment with @ to trigger mention dropdown
		await commentTextarea.fill(`This is a test comment @${user2firstName}`);
		// Wait for the mentions list to appear
		await page.waitForSelector('[data-testid="users-mentions-list"]');
		await page.click(`li:has-text(${user2firstName})`);

		await page.click('button:has-text("Post Comment")');

		// Verify the user's mention appears in the comments field
		const commentValue = await page.locator('textarea[name="comment"]').inputValue();
		expect(commentValue).toContain(`@${user2firstName}`);

		// Close the browser context
		await context.close();
	});

	// TODO Fourth test: Sign out as user1
	//

	// TODO Fifth test: Sign in as user2
	//

	// TODO Sixth test: Complete the task created by user1 and add a completion attachment
	//

	// TODO Seventh test: Sign out as user2
	//

	// TODO Eighth test: Sign in as user1
	//

	// TODO Ninth test: Close the task created by user1
	//
});
