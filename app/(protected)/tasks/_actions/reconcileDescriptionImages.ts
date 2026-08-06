import { extractDescriptionImageIds } from "@/lib/richText";
import { descriptionImagesDir } from "@/lib/richText.server";
import logger from "@/lib/logging";
import prisma from "@/prisma/client";
import fs from "fs-extra";

/**
 * Sync the DescriptionImage rows for a task with the images its description actually references.
 *
 * Uploads start life as drafts (taskId null) because images can be added on the New Task page
 * before a task exists. Once the task is saved we claim the drafts it references, and drop any
 * image previously attached to the task that the new description no longer uses.
 *
 * Call this right after the task row is written.
 */
export default async function reconcileDescriptionImages(taskId: number, description: string) {
	const referencedIds = extractDescriptionImageIds(description);

	// Claim drafts referenced by this description. Restricting to taskId null means one task can
	// never steal another task's image by pasting its URL.
	if (referencedIds.length > 0) {
		const claimed = await prisma.descriptionImage.updateMany({
			where: { id: { in: referencedIds }, taskId: null },
			data: { taskId },
		});
		if (claimed.count > 0) logger(`Claimed ${claimed.count} description image(s) for task ${taskId}`);
	}

	// Drop images this task owns that the description no longer references
	const orphaned = await prisma.descriptionImage.findMany({
		where: { taskId, id: { notIn: referencedIds } },
	});

	for (const image of orphaned) {
		await fs.remove(`${descriptionImagesDir()}/${image.path}`).catch((error) => logger(`Could not delete description image file ${image.path}: ${error?.message ?? error}`));
	}

	if (orphaned.length > 0) {
		await prisma.descriptionImage.deleteMany({ where: { id: { in: orphaned.map((image) => image.id) } } });
		logger(`Removed ${orphaned.length} unreferenced description image(s) from task ${taskId}`);
	}
}
