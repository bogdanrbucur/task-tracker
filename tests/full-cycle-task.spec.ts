import { expect, test } from "@playwright/test";
import fs from "fs";
import path from "path";
import {
	attachmentFilename,
	createTaskStatuses,
	createTestDepartment,
	createTestUser,
	deleteExistingScreenshots,
	deleteTestDb,
	departmentName,
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

// Configure the describe block to isolate hooks
test.describe.configure({ mode: "serial" });

test.describe("Task creation and closing", () => {
	test.beforeAll(async () => {
		await deleteExistingScreenshots();
		await createTestUser();
		await createTaskStatuses();
		await createTestDepartment();
	});

	// Clean up the database after all tests
	test.afterAll(async ({ browser }) => {
		await deleteTestDb();
		await browser.close();
	});

	test("Admin user sign-in", async ({ page }) => {
		await page.goto("/sign-in");
		await page.fill('input[name="email"]', user1email);
		await page.fill('input[name="password"]', usersPass);
		const ss = await page.screenshot({ path: "./tests/0-sign-in.png" });
		test.info().attach("sign-in", { body: ss, contentType: "image/png" });
		await page.click('button[type="submit"]');
		await expect(page).toHaveURL("/");
		await expect(page.getByTestId("firstName")).toContainText(user1firstName);
		const ss2 = await page.screenshot({ path: "./tests/1-dashboard.png" });
		test.info().attach("dashboard", { body: ss2, contentType: "image/png" });
		// Save the storage state
		await page.context().storageState({ path: storageStatePath });
	});

	test("Assign manager to Normal user", async ({ browser }) => {
		const context = await browser.newContext({ storageState: storageStatePath });
		const page = await context.newPage();

		await test.step("Navigate to users list", async () => {
			await page.goto("/users");
			await page.waitForLoadState("networkidle");
			await page.waitForTimeout(2000);
			const ss = await page.screenshot({ path: "./tests/3-users-list.png" });
			test.info().attach("users-list", { body: ss, contentType: "image/png" });
		});

		await test.step("Select Normal user", async () => {
			await page.locator(`a:has-text("${user2firstName} ${user2lastName}")`).click();
		});

		await test.step("Edit user details", async () => {
			await page.waitForLoadState("networkidle");
			await page.waitForTimeout(5000);
			const ss1 = await page.screenshot({ path: "./tests/4-user-details.png" });
			test.info().attach("user-details", { body: ss, contentType: "image/png" });

			await page.click('a:has-text("Edit")');
			await page.waitForLoadState("networkidle");
			await page.waitForTimeout(2000);
			const ss2 = await page.screenshot({ path: "./tests/5-user-edit.png" });
			test.info().attach("user-edit", { body: ss2, contentType: "image/png" });
		});

		await test.step("Select manager", async () => {
			await page.click('text="Select a user..."');
			await page.waitForSelector('div[role="listbox"]', { state: "visible" });
			const ss = await page.screenshot({ path: "./tests/5-users-dropdown.png" });
			test.info().attach("users-dropdown", { body: ss, contentType: "image/png" });
			await page.locator('div[role="listbox"]').locator(`text=${user1firstName}`).first().click();
			await page.waitForTimeout(500);
		});

		await test.step("Select department", async () => {
			await page.click('text="Select a department"');
			await page.waitForSelector('div[role="listbox"]', { state: "visible" });
			await page.locator('div[role="listbox"]').locator(`text=${departmentName}`).click();
		});

		await test.step("Save user details", async () => {
			await page.click('button:has-text("Save User")');
			await page.waitForLoadState("networkidle");
			await page.waitForTimeout(3000);
			const ss = await page.screenshot({ path: "./tests/6-user-updated.png" });
			test.info().attach("user-updated", { body: ss, contentType: "image/png" });
		});

		await test.step("Verify manager is updated", async () => {
			await page.waitForSelector(`a:has-text("${user1firstName} ${user1lastName}")`, { state: "visible" });
			const nameExists = await page.locator(`a:has-text("${user1firstName} ${user1lastName}")`).isVisible();
			expect(nameExists).toBeTruthy();
		});

		await test.step("Verify department is updated", async () => {
			await page.waitForSelector(`p:has-text("${departmentName}")`, { state: "visible" });
			const departmentExists = await page.locator(`p:has-text("${departmentName}")`).isVisible();
			expect(departmentExists).toBeTruthy();
		});

		const ss = await page.screenshot({ path: "./tests/6-user-updated.png" });
		test.info().attach("user-updated", { body: ss, contentType: "image/png" });
		await context.close();
	});

	test("Create new task", async ({ browser }) => {
		const context = await browser.newContext({ storageState: storageStatePath });
		const page = await context.newPage();

		await page.goto("/tasks/new");
		await test.step("Input task title", async () => await page.fill('input[name="title"]', taskTitle));
		await test.step("Input task description", async () => await page.fill('textarea[name="description"]', taskDescription));

		await test.step("Select due date", async () => {
			await page.click('button:has-text("Pick a date")');
			while (!(await page.locator('text="December 2026"').isVisible())) await page.click('[aria-label="Go to next month"]');
			const ss = await page.screenshot({ path: "./tests/7-task-creation.png" });
			test.info().attach("task-creation", { body: ss, contentType: "image/png" });
			await page.click('button:has-text("31")');
			const dueDateInput = page.locator('input[name="dueDate"]');
			const value = await dueDateInput.inputValue();
			expect(value).toContain("2026-12-31");
		});

		await test.step("Select user", async () => {
			await page.click('text="Select a user..."');
			await page.waitForSelector('div[role="listbox"]', { state: "visible" });
			await page.locator('div[role="listbox"]').locator(`text=${user2firstName}`).click();
		});

		await test.step("Create task", async () => {
			await page.click('button:has-text("Create Task")');
			await page.waitForLoadState("networkidle");
			const ss = await page.screenshot({ path: "./tests/8-new-task.png" });
			test.info().attach("new-task", { body: ss, contentType: "image/png" });
		});

		await test.step("Verify task is created", async () => {
			await page.goto("/tasks");
			await expect(page).toHaveURL("/tasks");
			await expect(page.getByText(taskTitle)).toContainText(taskTitle);
		});
		await context.close();
	});

	test("Add task comment", async ({ browser }) => {
		const context = await browser.newContext({ storageState: storageStatePath });
		const page = await context.newPage();

		await test.step("Navigate to task", async () => {
			await page.goto("/tasks");
			await expect(page).toHaveURL("/tasks");
			const taskTitleElement = page.locator(`text=${taskTitle}`);
			await expect(taskTitleElement).toBeVisible();
			await page.waitForLoadState("networkidle");
			const ss = await page.screenshot({ path: "./tests/9-tasks-list.png" });
			test.info().attach("task-list", { body: ss, contentType: "image/png" });
			await page.waitForTimeout(300);
			await taskTitleElement.click();
			await page.waitForURL(/\/tasks\/\d+/);
			await page.waitForLoadState("networkidle");
			await page.waitForTimeout(1000);
			const ss2 = await page.screenshot({ path: "./tests/10-task-view.png" });
			test.info().attach("task-view", { body: ss2, contentType: "image/png" });
			await expect(page).toHaveURL(/\/tasks\/\d+/);
		});

		await test.step("Write task comment", async () => {
			await page.waitForSelector('textarea[name="comment"]');
			const commentTextarea = page.locator('textarea[name="comment"]');
			await commentTextarea.focus();
			await commentTextarea.fill(`This is a test comment @${user2firstName}`);
		});

		await test.step("Select user mention", async () => {
			await page.waitForSelector('[data-testid="users-mentions-list"]');
			const ss = await page.screenshot({ path: "./tests/11-comment-users.png" });
			test.info().attach("comment-users", { body: ss, contentType: "image/png" });
			await page.waitForTimeout(300);
			await page.click(`li:has-text("${user2firstName}")`);
		});

		await test.step("Post comment", async () => {
			await page.click('button:has-text("Post Comment")');
			await page.waitForLoadState("networkidle");
			await page.waitForTimeout(1000);
		});

		await test.step("Verify comment is added", async () => {
			const commentLocator = page.locator(`[data-testid="user-comment"]`);
			await expect(commentLocator).toContainText(`@${user2firstName}`);
			const ss = await page.screenshot({ path: "./tests/12-task-view.png" });
			test.info().attach("task-view", { body: ss, contentType: "image/png" });
		});
		await context.close();
	});

	test("Admin user sign-out", async ({ browser }) => {
		const context = await browser.newContext({ storageState: storageStatePath });
		const page = await context.newPage();

		await page.goto("/");
		await test.step("Check sign out button visible", async () => await expect(page.getByTestId("signout-button")).toBeVisible());
		await test.step("Sign out", async () => {
			await page.click('button[type="submit"]:has-text("Sign Out")');
			await expect(page).toHaveURL("/sign-in");
			await page.waitForLoadState("networkidle");
			const ss = await page.screenshot({ path: "./tests/13-sign-out.png" });
			test.info().attach("sign-out", { body: ss, contentType: "image/png" });
		});
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

	test("Normal user dashboard updated", async ({ browser }) => {
		const context = await browser.newContext({ storageState: storageStatePath });
		const page = await context.newPage();

		await page.goto("/");
		await page.waitForLoadState("networkidle");
		await page.waitForTimeout(2000);
		const ss = await page.screenshot({ path: "./tests/14-dashboard.png" });
		test.info().attach("dashboard", { body: ss, contentType: "image/png" });

		await test.step("Status chart to be visible in dashboard", async () =>
			await expect(page.locator('div[id="status-chart"] g.recharts-layer.recharts-pie')).toBeVisible());
		await test.step("Department chart to be visibile in dashboard", async () =>
			await expect(page.locator('div[id="dept-chart"] g.recharts-layer.recharts-pie')).toBeVisible());
		await test.step("Pending task to be visible in dashboard", async () => await expect(page.locator('div[id="my-tasks"]')).toContainText(taskTitle));
		await context.close();
	});

	test("Complete task", async ({ browser }) => {
		const context = await browser.newContext({ storageState: storageStatePath });
		const page = await context.newPage();

		await page.goto("/");
		await test.step("Navigate to the task from dashboard", async () => {
			const taskTitleElement = page.locator(`text=${taskTitle}`);
			await taskTitleElement.click();
			expect(page).toHaveURL(/\/tasks\/\d+/);
			await page.waitForLoadState("networkidle");
			await page.waitForTimeout(500);
		});

		await test.step("Click Complete button", async () => {
			const completeButton = page.locator('button:has-text("Complete")');
			expect(completeButton).toBeVisible();
			await completeButton.click();
			await page.waitForLoadState("networkidle");
			await page.waitForTimeout(500);
			const ss = await page.screenshot({ path: "./tests/15-task-completion.png" });
			test.info().attach("task-completion", { body: ss, contentType: "image/png" });
		});

		const commentLocator = page.locator(`[name="completeComment"]`);
		const fileInput = page.locator("input[type=file]");
		const attachmentDescription = page.locator('input[name="newDescription"]');
		const attachmentAddButton = page.locator('button:has-text("Add")');
		const attRemoveButton = page.locator('button:has-text("Remove")');

		await test.step("Task completion pop-up is visible", async () => {
			await expect(commentLocator).toBeVisible();
			await expect(fileInput).toBeVisible();
			await expect(attachmentDescription).toBeVisible();
			await expect(attachmentAddButton).toBeVisible();
		});

		await test.step("Fill in task completion text", async () => await commentLocator.fill(taskCompletionComment));
		await test.step("Add task completion attachment", async () => {
			await fileInput.setInputFiles(testAttachmentPath);
			await attachmentDescription.fill(testAttachmentDescription);
			await attachmentAddButton.click();
			await page.waitForLoadState("networkidle");
			await page.waitForTimeout(2000);
			const addedAttDescription = page.locator(`input[type="text"][disabled][value="${testAttachmentDescription}"]`);
			await expect(addedAttDescription).toHaveValue(testAttachmentDescription);
			expect(attRemoveButton).toBeVisible();
			const ss = await page.screenshot({ path: "./tests/16-task-completion.png" });
			test.info().attach("task-completion", { body: ss, contentType: "image/png" });
		});

		await test.step("Confirm task completion", async () => {
			const confirmButton = page.locator('button:has-text("Confirm")');
			await confirmButton.click();
			await page.waitForLoadState("networkidle");
			await page.waitForTimeout(2000);
			const ss = await page.screenshot({ path: "./tests/17-task-completed.png" });
			test.info().attach("task-completed", { body: ss, contentType: "image/png" });
		});

		await test.step("Completion attachment is visible", async () => await expect(page.getByTestId("completion-attachment")).toContainText(testAttachmentDescription));
		await test.step("Task history is updated with completion", async () =>
			await expect(page.locator('div[class="rounded-lg border bg-card text-card-foreground shadow-sm"]')).toContainText(
				`Task completed by ${user2firstName} ${user2lastName}: ${taskCompletionComment}`
			));
		await test.step("Task status updated to Pending Review", async () => await expect(page.locator('[data-testid="status-badge"]')).toContainText("Pending Review"));

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

	test("Admin user dashboard updated", async ({ browser }) => {
		const context = await browser.newContext({ storageState: storageStatePath });
		const page = await context.newPage();

		await page.goto("/");
		await page.waitForLoadState("networkidle");
		await page.waitForTimeout(2000);
		const ss = await page.screenshot({ path: "./tests/18-dashboard.png" });
		test.info().attach("dashboard", { body: ss, contentType: "image/png" });

		await test.step("Status chart to be visible in dashboard", async () => {
			await expect(page.locator('div[id="status-chart"] g.recharts-layer.recharts-pie')).toBeVisible();
		});

		await test.step("Department chart to be visibile in dashboard", async () => {
			await expect(page.locator('div[id="dept-chart"] g.recharts-layer.recharts-pie')).toBeVisible();
		});

		await test.step("Pending task to be visible in dashboard", async () => {
			await page.waitForSelector(`div[id="my-tasks"]:has-text("${taskTitle}")`, { state: "visible" });
			const nameExists = await page.locator(`div[id="my-tasks"]:has-text("${taskTitle}")`).isVisible();
			expect(nameExists).toBeTruthy();
		});

		await context.close();
	});

	test("Download task completion attachment", async ({ browser }) => {
		const context = await browser.newContext({ storageState: storageStatePath });
		const page = await context.newPage();

		await page.goto("/");

		await test.step("Navigate to the task from dashboard", async () => {
			const taskTitleElement = page.locator(`text=${taskTitle}`);
			await taskTitleElement.click();
			expect(page).toHaveURL(/\/tasks\/\d+/);
			await page.waitForLoadState("networkidle");
			await page.waitForTimeout(500);
		});

		let downloadPath = "";
		await test.step("Download the task completion attachment", async () => {
			const downloadButton = page.getByTestId("completion-attachment");
			expect(downloadButton).toBeVisible();
			await downloadButton.click();
			// Expect to receive the file download
			const download = await page.waitForEvent("download");
			// Expect the downloaded file to be the test file
			expect(download.suggestedFilename()).toBe(`completion_${attachmentFilename}`);

			// Save the downloaded file path
			downloadPath = path.join("./tasks/", download.suggestedFilename());
			await download.saveAs(downloadPath);

			await page.waitForTimeout(2000);
			const ss = await page.screenshot({ path: "./tests/19-task-attachment-download.png" });
			test.info().attach("task-attachment-download", { body: ss, contentType: "image/png" });
		});

		await test.step("Verify the downloaded file exists", async () => expect(fs.existsSync(downloadPath)).toBeTruthy());
		await test.step("Delete the downloaded file", async () => fs.unlinkSync(downloadPath));

		await context.close();
	});

	test("Close task as Admin User", async ({ browser }) => {
		const context = await browser.newContext({ storageState: storageStatePath });
		const page = await context.newPage();

		await page.goto("/");
		await test.step("Navigate to the task from dashboard", async () => {
			const taskTitleElement = page.locator(`text=${taskTitle}`);
			await taskTitleElement.click();
			expect(page).toHaveURL(/\/tasks\/\d+/);
			await page.waitForLoadState("networkidle");
			await page.waitForTimeout(500);
		});

		await test.step("Click Close button", async () => {
			const closeTaskButton = page.locator('button:has-text("Close")');
			expect(closeTaskButton).toBeVisible();
			await closeTaskButton.click();
			await page.waitForLoadState("networkidle");
			await page.waitForTimeout(500);
			const ss = await page.screenshot({ path: "./tests/20-task-closure.png" });
			test.info().attach("task-closure", { body: ss, contentType: "image/png" });
		});

		await test.step("Fill in task closing text", async () => {
			const commentLocator = page.locator(`[name="closeComment"]`);
			await expect(commentLocator).toBeVisible();
			await commentLocator.fill(taskClosingComment);
			await page.waitForLoadState("networkidle");
			await page.waitForTimeout(2000);
			const ss = await page.screenshot({ path: "./tests/21-task-closure.png" });
			test.info().attach("task-closure", { body: ss, contentType: "image/png" });
		});

		await test.step("Confirm task closure", async () => {
			const confirmButton = page.locator('button:has-text("Confirm")');
			await confirmButton.click();
			await page.waitForLoadState("networkidle");
			await page.waitForTimeout(2000);
		});

		await test.step("Task status updated to Closed", async () => await expect(page.locator('[data-testid="status-badge"]')).toContainText("Closed"));

		await test.step("Task history is updated with closure", async () =>
			await expect(page.locator('div[class="rounded-lg border bg-card text-card-foreground shadow-sm"]')).toContainText(
				`Task closed by ${user1firstName} ${user1lastName}: ${taskClosingComment}`
			));

		const ss = await page.screenshot({ path: "./tests/22-task-closed.png" });
		test.info().attach("task-closed", { body: ss, contentType: "image/png" });
		await context.close();
	});
});
