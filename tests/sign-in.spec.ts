import { expect, test } from "@playwright/test";
import { createTaskStatuses, createTestUser, deleteTestDb, user1email, user1firstName, user2firstName, usersPass } from "./tests-setup";

test.beforeAll(async () => {
	await createTestUser();
	await createTaskStatuses();
});

// Clean up the database after all tests
test.afterAll(async () => {
	await deleteTestDb();
});

test.describe("User sign-in and task creation and closing", () => {
	let storageStatePath = "storageState.json";

	// First test: User sign-in
	test("sign in functionality", async ({ page }) => {
		await page.goto("/sign-in");
		await page.fill('input[name="email"]', user1email);
		await page.fill('input[name="password"]', usersPass);
		await page.click('button[type="submit"]');
		await expect(page).toHaveURL("/");
		await expect(page.getByTestId("firstName")).toContainText(user1firstName);

		// Save the storage state
		await page.context().storageState({ path: storageStatePath });
	});

	// Second test: Create a task
	test("create a task", async ({ browser }) => {
		// Use the saved storage state
		const context = await browser.newContext({ storageState: storageStatePath });
		const page = await context.newPage();

		await page.goto("/tasks/new");
		await page.fill('input[name="title"]', "Test Task Title");
		await page.fill('textarea[name="description"]', "This is a test task created during automated testing workflows.");

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
		await expect(page.getByText("Test Task Title")).toContainText("Test Task Title");
		// Close the browser context
		await context.close();
	});

	// TODO Third test: Write a comment to user2
	//

	// TODO Fourth test: Sign out as user1
	//
});
