"use server";

// Ticks/unticks a single checklist item. This is deliberately its own action, separate from
// updateTask: it is called far more often (every click), by a slightly different set of people
// (also the assignee's manager, via canToggleChecklist), and it must not go through
// syncChecklistItems / task history - see canToggleChecklist for the permission and status rule.

import { PERMISSION_DENIED, canToggleChecklist, getActor, getTaskForAuth } from "@/actions/auth/require-auth";
import prisma from "@/prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const schema = z.object({
	itemId: z.coerce.number(),
	done: z.enum(["true", "false"]).transform((v) => v === "true"),
});

export default async function toggleChecklistItem(prevState: any, formData: FormData) {
	const actor = await getActor();
	if (!actor) return { message: PERMISSION_DENIED };

	let data;
	try {
		data = schema.parse({ itemId: formData.get("itemId"), done: formData.get("done") });
	} catch {
		return { message: "Invalid request." };
	}

	const item = await prisma.checklistItem.findUnique({ where: { id: data.itemId }, select: { taskId: true } });
	if (!item) return { message: "Checklist item not found." };

	const taskForAuth = await getTaskForAuth(item.taskId);
	if (!taskForAuth || !canToggleChecklist(taskForAuth, actor)) return { message: PERMISSION_DENIED };

	await prisma.checklistItem.update({
		where: { id: data.itemId },
		data: data.done
			? { done: true, completedAt: new Date(), completedById: actor.user.id }
			: { done: false, completedAt: null, completedById: null },
	});

	revalidatePath(`/tasks/${item.taskId}`);
	return { message: null };
}
