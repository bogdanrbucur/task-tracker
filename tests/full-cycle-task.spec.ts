import { expect, test } from "@playwright/test";
import fs from "fs";
import path from "path";
import {
	attachmentFilename,
	countDescriptionImageFiles,
	departmentName,
	getDescriptionImages,
	testImagePath,
	storageStatePath,
	taskClosingComment,
	taskCompletionComment,
	taskDescription,
	taskDescriptionLinkUrl,
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

// Seeding and teardown live in tests/global-setup.ts and tests/global-teardown.ts, so that this
// file no longer owns the database that other spec files also use.
test.describe("Task creation and closing", () => {
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
			const ss = await page.screenshot({ path: "./tests/4-user-details.png" });
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
			while (!(await page.locator('text="December 2026"').isVisible())) await page.click('[aria-label="Go to the Next Month"]');
			const ss = await page.screenshot({ path: "./tests/7-task-creation.png" });
			test.info().attach("task-creation", { body: ss, contentType: "image/png" });
			await page.click('button:has-text("31")');
			const dueDateInput = page.locator('input[name="dueDate"]');
			const value = await dueDateInput.inputValue();
			expect(value).toMatch(/2026-12-(30|31)/);
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

	test("Task description renders as rich text", async ({ browser }) => {
		const context = await browser.newContext({ storageState: storageStatePath });
		const page = await context.newPage();

		await test.step("Navigate to task", async () => {
			await page.goto("/tasks");
			await page.locator(`text=${taskTitle}`).click();
			await page.waitForURL(/\/tasks\/\d+/);
			await page.waitForLoadState("networkidle");
		});

		const description = page.getByTestId("task-description");

		await test.step("Markdown is rendered rather than shown as raw syntax", async () => {
			await expect(description.locator("strong")).toHaveText("test task");
			await expect(description.locator("ul li")).toHaveCount(2);
			await expect(description).not.toContainText("**test task**");
		});

		await test.step("Links open safely in a new tab", async () => {
			const link = description.locator(`a[href="${taskDescriptionLinkUrl}"]`);
			await expect(link).toHaveText("the docs");
			await expect(link).toHaveAttribute("target", "_blank");
			await expect(link).toHaveAttribute("rel", /noopener/);
		});

		await test.step("Raw HTML and javascript: URLs stay inert", async () => {
			await expect(description.locator("script")).toHaveCount(0);
			// The script tag must survive as visible text, not as markup
			await expect(description).toContainText("<script>alert('xss')</script>");
			await expect(description.locator('a[href^="javascript:"]')).toHaveCount(0);
		});

		await context.close();
	});

	test("Search finds text inside markdown formatting", async ({ browser }) => {
		const context = await browser.newContext({ storageState: storageStatePath });
		const page = await context.newPage();

		// "checklist" only appears in the description, inside a markdown list item - so a hit
		// proves the search still reaches description text now that it is stored as markdown
		await page.goto("/tasks?search=checklist");
		await page.waitForLoadState("networkidle");
		await expect(page.getByText(taskTitle)).toContainText(taskTitle);

		await test.step("A term that appears nowhere returns no match", async () => {
			await page.goto("/tasks?search=zzzznotpresent");
			await page.waitForLoadState("networkidle");
			await expect(page.getByText(taskTitle)).toHaveCount(0);
		});

		await context.close();
	});

	test("Markdown toolbar formats the description", async ({ browser }) => {
		const context = await browser.newContext({ storageState: storageStatePath });
		const page = await context.newPage();

		await page.goto("/tasks");
		await page.locator(`text=${taskTitle}`).click();
		await page.waitForURL(/\/tasks\/\d+/);
		await page.click('a:has-text("Edit")');
		await page.waitForURL(/\/tasks\/\d+\/edit/);

		const textarea = page.locator('textarea[name="description"]');
		await textarea.fill("Check the main valve before starting the work.");

		await test.step("Bold wraps the selected text", async () => {
			// Select the words "main valve"
			await textarea.evaluate((el: HTMLTextAreaElement) => {
				const start = el.value.indexOf("main valve");
				el.focus();
				el.setSelectionRange(start, start + "main valve".length);
			});
			await page.click('button[aria-label="Bold (Ctrl/⌘ B)"]');
			await expect(textarea).toHaveValue(/Check the \*\*main valve\*\* before/);
		});

		await test.step("Bulleted list prefixes the line", async () => {
			await page.click('button[aria-label="Bulleted list"]');
			await expect(textarea).toHaveValue(/^- /);
		});

		await test.step("Preview renders the markdown", async () => {
			await page.click('button[aria-label="Preview description"]');
			const preview = page.locator(".prose");
			await expect(preview.locator("strong")).toHaveText("main valve");
			await expect(preview.locator("ul li")).toHaveCount(1);
		});

		// Leave without saving so the description is unchanged for later tests
		await page.click('a:has-text("Cancel")');
		await context.close();
	});

	test("Too short a description is rejected", async ({ browser }) => {
		const context = await browser.newContext({ storageState: storageStatePath });
		const page = await context.newPage();

		await page.goto("/tasks");
		await page.locator(`text=${taskTitle}`).click();
		await page.waitForURL(/\/tasks\/\d+/);
		await page.click('a:has-text("Edit")');
		await page.waitForURL(/\/tasks\/\d+\/edit/);

		await page.locator('textarea[name="description"]').fill("too short");
		await page.click('button:has-text("Save Task")');

		await expect(page.getByText("Description must be at least 20 characters.")).toBeVisible();
		// Still on the edit page - nothing was saved
		await expect(page).toHaveURL(/\/tasks\/\d+\/edit/);

		await context.close();
	});

	test("Inline description image uploads, persists and is cleaned up", async ({ browser }) => {
		const context = await browser.newContext({ storageState: storageStatePath });
		const page = await context.newPage();

		await page.goto("/tasks");
		await page.locator(`text=${taskTitle}`).click();
		await page.waitForURL(/\/tasks\/\d+/);
		const taskUrl = page.url();
		await page.click('a:has-text("Edit")');
		await page.waitForURL(/\/tasks\/\d+\/edit/);

		const textarea = page.locator('textarea[name="description"]');
		await textarea.fill("Inspect the equipment shown in the photo below before starting.\n\n");

		await test.step("Upload starts as an unattached draft", async () => {
			// The editor's own picker, not the source-attachments one
			await page.locator('input[type="file"][accept="image/*"]').setInputFiles(testImagePath);
			await expect.poll(() => textarea.inputValue(), { timeout: 15000 }).toContain("/api/description-images/");

			const images = await getDescriptionImages();
			expect(images).toHaveLength(1);
			// Not yet tied to the task - this is what lets images be added on the New Task page
			expect(images[0].taskId).toBeNull();
			// Downscaled from testImageWidth to the 1600px cap
			expect(images[0].width).toBe(1600);
		});

		await test.step("Saving attaches the image to the task", async () => {
			await page.click('button:has-text("Save Task")');
			await page.waitForURL(/\/tasks\/\d+$/);

			const images = await getDescriptionImages();
			expect(images).toHaveLength(1);
			expect(images[0].taskId).not.toBeNull();
		});

		await test.step("Image renders in the description", async () => {
			const image = page.getByTestId("task-description").locator("img");
			await expect(image).toHaveAttribute("src", /\/api\/description-images\//);
			// The image is loading="lazy", so bring it into view and wait for the bytes to arrive.
			// A non-zero naturalWidth proves the auth-gated route actually served the image.
			await image.scrollIntoViewIfNeeded();
			await expect.poll(() => image.evaluate((el: HTMLImageElement) => el.naturalWidth), { timeout: 15000 }).toBe(1600);
		});

		await test.step("Removing it from the description deletes the row and the file", async () => {
			await page.goto(`${taskUrl}/edit`);
			const editTextarea = page.locator('textarea[name="description"]');
			// Wait for the controlled MarkdownEditor to hydrate and take over the SSR'd value before
			// mutating it - fill() only waits for the element to be visible/enabled, not interactive,
			// so filling too early can land before React's onChange sync is attached.
			await expect(editTextarea).toHaveValue(/Inspect the equipment/);
			// Clear explicitly before filling - fill() on this controlled textarea can otherwise land
			// as an insert-at-caret rather than a full replace if a re-render races the selection,
			// leaving the old text (and the image markdown) in place.
			await editTextarea.click();
			await editTextarea.press("ControlOrMeta+A");
			await editTextarea.press("Backspace");
			await editTextarea.fill("The photo is no longer needed for this task.");
			await expect(editTextarea).toHaveValue("The photo is no longer needed for this task.");
			await page.click('button:has-text("Save Task")');
			await page.waitForURL(/\/tasks\/\d+$/);

			expect(await getDescriptionImages()).toHaveLength(0);
			expect(countDescriptionImageFiles()).toBe(0);
			await expect(page.getByTestId("task-description").locator("img")).toHaveCount(0);
		});

		await context.close();
	});

	test("Task history shows a diff for description changes", async ({ browser }) => {
		const context = await browser.newContext({ storageState: storageStatePath });
		const page = await context.newPage();

		await page.goto("/tasks");
		await page.locator(`text=${taskTitle}`).click();
		await page.waitForURL(/\/tasks\/\d+/);
		await page.click('a:has-text("Edit")');
		await page.waitForURL(/\/tasks\/\d+\/edit/);

		const textarea = page.locator('textarea[name="description"]');
		// Wait for the controlled MarkdownEditor to hydrate and take over the SSR'd value before
		// mutating it - fill() only waits for the element to be visible/enabled, not interactive.
		await expect(textarea).toHaveValue(/The photo is no longer needed/);
		const oldDescription = await textarea.inputValue();
		const addedText = "Please verify calibration too.";
		await textarea.fill(`${oldDescription} ${addedText}`);
		await page.click('button:has-text("Save Task")');
		await page.waitForURL(/\/tasks\/\d+$/);

		await test.step("History records a diff, not the full body twice", async () => {
			// The task's description was already edited by earlier tests, so there may be several
			// "Description changed" entries - only the most recent one covers this edit.
			const summary = page.locator('[data-testid="change-text"]').filter({ hasText: `Description changed by ${user1firstName} ${user1lastName}` });
			await expect(summary.last()).toBeVisible();

			const diff = page.locator('[data-testid="description-diff"]').last();
			await expect(diff.locator("ins")).toHaveText(new RegExp(addedText));
			await expect(diff.locator("del")).toHaveCount(0);
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
		await test.step("Task history is updated with completion", async () => {
			const expectedCompletion = `Task completed by ${user2firstName} ${user2lastName}: ${taskCompletionComment}`;
			await expect(page.locator('[data-testid="change-text"]').filter({ hasText: expectedCompletion })).toHaveCount(1);
		});
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
