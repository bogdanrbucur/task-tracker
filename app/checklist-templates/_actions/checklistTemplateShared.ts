// Constants, schema and DB helper shared by the checklist-template create/update actions.
//
// Deliberately NOT a "use server" module: syncTemplateItems takes a raw templateId and performs no
// permission check of its own - it trusts the caller (saveTemplate, which already authorized the
// write via getAdminActor). A "use server" directive turns every export into a publicly callable
// endpoint. Same reasoning as app/(protected)/tasks/_actions/checklistShared.ts.

import { ChecklistItemInput, MAX_CHECKLIST_ITEMS, type ChecklistItemInputType } from "@/app/(protected)/tasks/_actions/checklistShared";
import prisma from "@/prisma/client";
import { z } from "zod";

export const TEMPLATE_NAME_MIN = 2;

export const TemplateItemsInput = z
	.array(ChecklistItemInput)
	.min(1, { message: "A template needs at least one checklist item." })
	.max(MAX_CHECKLIST_ITEMS, { message: `A template may have at most ${MAX_CHECKLIST_ITEMS} checklist items.` });

/**
 * Write a template's items to match `items` exactly, diffed by id so item ids stay stable across an
 * edit that only reorders or renames. Positions are rewritten from array order on every save.
 * Mirrors syncChecklistItems in checklistShared.ts (minus the task-history summary).
 */
export async function syncTemplateItems(templateId: number, items: ChecklistItemInputType[]): Promise<void> {
	const existing = await prisma.checklistTemplateItem.findMany({ where: { templateId }, select: { id: true } });
	const existingIds = new Set(existing.map((i) => i.id));
	const keptIds = new Set(items.filter((i) => i.id !== undefined).map((i) => i.id!));

	const toDelete = [...existingIds].filter((id) => !keptIds.has(id));
	const toAdd = items.filter((i) => i.id === undefined);
	const toUpdate = items.filter((i) => i.id !== undefined && existingIds.has(i.id!));

	if (toDelete.length > 0) await prisma.checklistTemplateItem.deleteMany({ where: { id: { in: toDelete } } });

	for (const [position, item] of toUpdate.entries()) {
		await prisma.checklistTemplateItem.update({ where: { id: item.id! }, data: { text: item.text, position } });
	}

	for (const [i, item] of toAdd.entries()) {
		await prisma.checklistTemplateItem.create({ data: { templateId, text: item.text, position: toUpdate.length + i } });
	}
}
