/**
 * Coverage for admin-managed checklist templates and the "Add from template" picker on the task
 * form. Named zz-* so it sorts after every other spec - it signs in afresh (rather than reusing the
 * shared storageState.json, whose identity the earlier specs leave in an undefined state) and
 * creates its own template/task fixtures, so it neither depends on nor disturbs them.
 */

import { expect, test } from "@playwright/test";
import fs from "fs-extra";
import prisma from "@/prisma/client";
import {
	createTaskFor,
	deleteTaskById,
	getChecklistItems,
	getUserByEmail,
	stEmployeeEmail,
	stManagerEmail,
	user1email,
	user2email,
	usersPass,
} from "./tests-setup";

test.describe.configure({ mode: "serial" });

const adminStatePath = "./tests/zz-admin-state.json";
const templateName = "***Vessel Checks Template***";
const templateItems = ["MV Alpha", "MV Bravo", "MV Charlie"];

async function settle(page: import("@playwright/test").Page) {
	await page.waitForLoadState("networkidle");
	await page.waitForTimeout(500);
}

test.describe("Checklist templates", () => {
	test.afterAll(async () => {
		await prisma.checklistTemplate.deleteMany({ where: { name: { contains: "***" } } });
		await fs.remove(adminStatePath);
	});

	test("Admin sign-in", async ({ browser }) => {
		const context = await browser.newContext();
		const page = await context.newPage();
		await page.goto("/sign-in");
		await page.fill('input[name="email"]', user1email);
		await page.fill('input[name="password"]', usersPass);
		await page.click('button[type="submit"]');
		await expect(page).toHaveURL("/");
		await context.storageState({ path: adminStatePath });
		await context.close();
	});

	test("An admin can create a template with ordered items", async ({ browser }) => {
		const context = await browser.newContext({ storageState: adminStatePath });
		const page = await context.newPage();

		await page.goto("/checklist-templates");
		await page.click('a:has-text("New template")');
		await expect(page).toHaveURL("/checklist-templates/new");

		await page.fill('input[name="name"]', templateName);
		for (const text of templateItems) {
			await page.fill('input[placeholder*="checklist item"]', text);
			await page.click('[data-testid="checklist-add-button"]');
		}
		await page.click('button:has-text("Create template")');
		await settle(page);
		await expect(page).toHaveURL("/checklist-templates");

		const saved = await prisma.checklistTemplate.findUnique({
			where: { name: templateName },
			include: { items: { orderBy: { position: "asc" } } },
		});
		expect(saved).not.toBeNull();
		expect(saved!.items.map((i) => i.text)).toEqual(templateItems);

		await context.close();
	});

	test("An existing template can be renamed and its items edited without a duplicate-name error", async ({ browser }) => {
		const existing = await prisma.checklistTemplate.findUniqueOrThrow({ where: { name: templateName } });

		const context = await browser.newContext({ storageState: adminStatePath });
		const page = await context.newPage();
		await page.goto(`/checklist-templates/${existing.id}/edit`);

		// Keep the same name (the row's own name must not trip the unique constraint), add one item.
		await page.fill('input[placeholder*="checklist item"]', "MV Delta");
		await page.click('[data-testid="checklist-add-button"]');
		await page.click('button:has-text("Save template")');
		await settle(page);
		await expect(page).toHaveURL("/checklist-templates");

		const updated = await prisma.checklistTemplate.findUniqueOrThrow({
			where: { id: existing.id },
			include: { items: { orderBy: { position: "asc" } } },
		});
		expect(updated.items.map((i) => i.text)).toEqual([...templateItems, "MV Delta"]);

		// Restore so the later picker test still sees exactly three items.
		await prisma.checklistTemplateItem.deleteMany({ where: { templateId: existing.id, text: "MV Delta" } });

		await context.close();
	});

	test("A template with no items is rejected", async ({ browser }) => {
		const context = await browser.newContext({ storageState: adminStatePath });
		const page = await context.newPage();

		await page.goto("/checklist-templates/new");
		await page.fill('input[name="name"]', "***Empty Template***");
		await page.click('button:has-text("Create template")');
		await settle(page);

		await expect(page.locator("text=at least one checklist item")).toBeVisible();
		expect(await prisma.checklistTemplate.findUnique({ where: { name: "***Empty Template***" } })).toBeNull();

		await context.close();
	});

	test("Selecting a template on the task edit form appends its items in order", async ({ browser }) => {
		const manager = await getUserByEmail(stManagerEmail);
		const employee = await getUserByEmail(stEmployeeEmail);
		if (!manager || !employee) throw new Error("Expected stManager/stEmployee from globalSetup");

		const task = await createTaskFor(employee.id, manager.id, "***Template Picker Task***");

		const context = await browser.newContext({ storageState: adminStatePath });
		const page = await context.newPage();
		await page.goto(`/tasks/${task.id}/edit`);

		// Apply once - the checklist starts empty, so the three template items land in order.
		await page.locator('[data-testid="checklist-template-select"]').click();
		await page.getByRole("option", { name: `${templateName} (3)` }).click();
		await expect(page.locator('[data-testid="checklist-editor-item"]')).toHaveCount(3);

		// Apply again - items append after the existing ones rather than replacing them.
		await page.locator('[data-testid="checklist-template-select"]').click();
		await page.getByRole("option", { name: `${templateName} (3)` }).click();
		await expect(page.locator('[data-testid="checklist-editor-item"]')).toHaveCount(6);

		await page.click('button:has-text("Save Task")');
		await settle(page);

		const items = await getChecklistItems(task.id);
		expect(items.map((i) => i.text)).toEqual([...templateItems, ...templateItems]);

		await deleteTaskById(task.id);
		await context.close();
	});

	test("A non-admin cannot reach the templates pages", async ({ browser }) => {
		const context = await browser.newContext();
		const page = await context.newPage();
		await page.goto("/sign-in");
		await page.fill('input[name="email"]', user2email);
		await page.fill('input[name="password"]', usersPass);
		await page.click('button[type="submit"]');
		await expect(page).toHaveURL("/");

		await page.goto("/checklist-templates");
		await expect(page.locator("text=could not find the page")).toBeVisible();

		await page.goto("/checklist-templates/new");
		await expect(page.locator("text=could not find the page")).toBeVisible();

		await context.close();
	});
});
