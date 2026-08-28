"use server";

// Loads a task server-side to prefill the New Task form for Duplicate (?copyFrom=<id>) and Add
// sub-task (?parent=<id>).
//
// Prefilling through a server load rather than URL query params matters here specifically: task
// descriptions run up to MAX_DESCRIPTION_LENGTH (16,384 characters, see lib/richText.ts), which
// cannot round-trip through a query string.

import { canEditTask, getActor, getTaskForAuth } from "@/actions/auth/require-auth";
import { descriptionImagesDir } from "@/lib/richText.server";
import { extractDescriptionImageIds } from "@/lib/richText";
import prisma from "@/prisma/client";
import fs from "fs-extra";
import { randomUUID } from "crypto";

export interface TaskCopyForPrefill {
	title: string;
	description: string;
	source: string | null;
	sourceLink: string | null;
	assignedToUser: { id: string; firstName: string; lastName: string } | null;
	// Only set when the original's due date is still in the future - see the Duplicate rule.
	dueDate: Date | null;
	dueDateWasNotCopied: boolean;
	checklistItems: { text: string }[];
	copyFromTaskId: number;
}

/**
 * Prefill data for Duplicate. Only ever readable by someone who could edit the source task, same
 * as any other view of it - Duplicate is not a way to peek at a task outside your scope.
 */
export async function getTaskCopyForPrefill(taskId: number): Promise<TaskCopyForPrefill | null> {
	const actor = await getActor();
	if (!actor) return null;

	const taskForAuth = await getTaskForAuth(taskId);
	if (!taskForAuth || !canEditTask(taskForAuth, actor)) return null;

	const task = await prisma.task.findUnique({
		where: { id: taskId },
		include: {
			assignedToUser: { select: { id: true, firstName: true, lastName: true } },
			checklistItems: { orderBy: { position: "asc" } },
		},
	});
	if (!task) return null;

	// Clone each inline description image referenced by the description into a fresh draft row
	// (taskId null) with a new id, and rewrite the markdown to point at the copies. Without this,
	// the duplicate's description would reference the original's image rows - editing or deleting
	// the original would then silently break images in the copy (reconcileDescriptionImages drops
	// any DescriptionImage a task's current description no longer references).
	const referencedIds = extractDescriptionImageIds(task.description);
	let description = task.description;

	if (referencedIds.length > 0) {
		const images = await prisma.descriptionImage.findMany({ where: { id: { in: referencedIds } } });
		await fs.ensureDir(descriptionImagesDir());

		for (const image of images) {
			const newId = randomUUID();
			const extension = image.path.includes(".") ? image.path.slice(image.path.lastIndexOf(".")) : "";
			const newPath = `${newId}${extension}`;

			const sourceFile = `${descriptionImagesDir()}/${image.path}`;
			if (!(await fs.pathExists(sourceFile))) continue;
			await fs.copy(sourceFile, `${descriptionImagesDir()}/${newPath}`);

			await prisma.descriptionImage.create({
				data: { id: newId, taskId: null, path: newPath, width: image.width, height: image.height, createdBy: actor.user.id },
			});

			description = description.split(`/api/description-images/${image.id}`).join(`/api/description-images/${newId}`);
		}
	}

	const dueDateInFuture = task.dueDate > new Date();

	return {
		title: task.title,
		description,
		source: task.source,
		sourceLink: task.sourceLink,
		assignedToUser: task.assignedToUser,
		dueDate: dueDateInFuture ? task.dueDate : null,
		dueDateWasNotCopied: !dueDateInFuture,
		checklistItems: task.checklistItems.map((i) => ({ text: i.text })),
		copyFromTaskId: task.id,
	};
}
