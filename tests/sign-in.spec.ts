import { expect, test } from "@playwright/test";
import { createTestUser, deleteTestDb, firstName, password, email } from "./tests-setup";

// Create a test user in the database
let testingUser: any;
test.beforeAll(async () => {
	testingUser = await createTestUser();
});

// Delete the test user from the database
test.afterAll(async () => {
	await deleteTestDb();
});

test("sign in functionality", async ({ page }) => {
	await page.goto("http://localhost:3535/sign-in");
	await page.fill('input[name="email"]', email);
	await page.fill('input[name="password"]', password);
	await page.click('button[type="submit"]');
	await expect(page).toHaveURL("http://localhost:3535/");
	await expect(page.getByTestId("firstName")).toContainText(firstName);
});
