// Checklist constants, schema and DB helpers shared by the create/update task actions and the
// toggle action.
//
// Deliberately NOT a "use server" module: syncChecklistItems and copyChecklistItems take a raw
// taskId and perform no permission check of their own - they trust the caller (createTask/
// updateTask, which already authorized the write) to have checked. A "use server" directive turns
// every export into a publicly callable endpoint, which would make these callable directly with no
// auth check at all. Only actions meant to be called from the client (toggleChecklistItem, in its
// own "use server" file) live behind that boundary.

import prisma from "@/prisma/client";
import { z } from "zod";

export const MAX_CHECKLIST_ITEMS = 50;
// Kept short deliberately: the detail page shows the "X completed on <date>" attribution on the
// same line as the item text (see ChecklistSection.tsx) rather than wrapping to a second line, so a
// long item text and the attribution would otherwise fight for the same row. The text still
// truncates with an ellipsis (full text on hover) if it doesn't fit at the viewer's width, but this
// cap keeps that the exception rather than the rule. Mirrored in ChecklistEditor.tsx, which can't
// import this module directly (it pulls in the Prisma client, which breaks the client bundle).
export const MAX_CHECKLIST_ITEM_LENGTH = 80;

export const ChecklistItemInput = z.object({
	// Present for an existing item being kept/edited; absent for a newly added one.
	id: z.number().optional(),
	text: z.string().min(1).max(MAX_CHECKLIST_ITEM_LENGTH),
});

export const ChecklistItemsInput = z.array(ChecklistItemInput).max(MAX_CHECKLIST_ITEMS, {
	message: `A task may have at most ${MAX_CHECKLIST_ITEMS} checklist items.`,
});

export type ChecklistItemInputType = z.infer<typeof ChecklistItemInput>;

/**
 * Write a task's checklist items to match `items` exactly, diffed by id so ticked state on
 * untouched items survives an edit that only changes the title or due date.
 *
 * Returns a one-line summary for the task history, or null if nothing changed - collapsing what
 * would otherwise be up to 50 individual Change rows for a single edit.
 */
export async function syncChecklistItems(taskId: number, items: ChecklistItemInputType[]): Promise<string | null> {
	const existing = await prisma.checklistItem.findMany({ where: { taskId }, select: { id: true } });
	const existingIds = new Set(existing.map((i) => i.id));
	const keptIds = new Set(items.filter((i) => i.id !== undefined).map((i) => i.id!));

	const toDelete = [...existingIds].filter((id) => !keptIds.has(id));
	const toAdd = items.filter((i) => i.id === undefined);
	const toUpdate = items.filter((i) => i.id !== undefined && existingIds.has(i.id!));

	if (toDelete.length > 0) await prisma.checklistItem.deleteMany({ where: { id: { in: toDelete } } });

	for (const [position, item] of toUpdate.entries()) {
		await prisma.checklistItem.update({ where: { id: item.id! }, data: { text: item.text, position } });
	}

	for (const [i, item] of toAdd.entries()) {
		await prisma.checklistItem.create({ data: { taskId, text: item.text, position: toUpdate.length + i } });
	}

	if (toDelete.length === 0 && toAdd.length === 0) return null;
	const parts = [];
	if (toAdd.length > 0) parts.push(`${toAdd.length} item${toAdd.length === 1 ? "" : "s"} added`);
	if (toDelete.length > 0) parts.push(`${toDelete.length} item${toDelete.length === 1 ? "" : "s"} removed`);
	return `Checklist updated: ${parts.join(", ")}`;
}

/** Copies a task's checklist item texts (unticked) onto another task - used by Duplicate. */
export async function copyChecklistItems(sourceTaskId: number, newTaskId: number) {
	const items = await prisma.checklistItem.findMany({ where: { taskId: sourceTaskId }, orderBy: { position: "asc" } });
	if (items.length === 0) return;
	await prisma.checklistItem.createMany({
		data: items.map((item, position) => ({ taskId: newTaskId, text: item.text, position })),
	});
}
