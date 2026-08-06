import { MAX_ATTACHMENT_SIZE_BYTES, MAX_ATTACHMENT_SIZE_MB, findAttachmentFile, isInsideDir, sanitizeAttachmentFilename, taskAttachmentsDir } from "@/lib/attachments";
import logger from "@/lib/logging";
import prisma from "@/prisma/client";
import { Task } from "@prisma/client";
import { randomUUID } from "crypto";
import fs from "fs-extra";

export class AttachmentError extends Error {}

export default async function saveAttachment(attachment: File, task: Task, attachmentDescription: string, type: "source" | "completion") {
	let response;
	try {
		if (attachment.size > MAX_ATTACHMENT_SIZE_BYTES) {
			throw new AttachmentError(`Attachment must not exceed ${MAX_ATTACHMENT_SIZE_MB} MB`);
		}

		// The uploaded filename is attacker-controlled and must never be used to build a path as-is
		const safeName = sanitizeAttachmentFilename(attachment.name);
		if (!safeName) throw new AttachmentError("Invalid attachment filename");

		const storedName = `${type}_${safeName}`;
		const attachmentsFolderPath = taskAttachmentsDir(task.id);
		const destination = `${attachmentsFolderPath}/${storedName}`;

		// Defence in depth: refuse to write anywhere outside this task's own folder
		if (!isInsideDir(attachmentsFolderPath, destination)) throw new AttachmentError("Invalid attachment filename");

		const arrayBuffer = await attachment.arrayBuffer();
		const attachmentBuffer = Buffer.from(arrayBuffer);

		// Check if the task has an attachment folder, and then check if the attachment already exists
		if (await fs.pathExists(attachmentsFolderPath)) {
			const attachments = await fs.readdir(attachmentsFolderPath);
			const oldattachment = findAttachmentFile(attachments, storedName);
			if (oldattachment) {
				const oldPath = `${attachmentsFolderPath}/${oldattachment}`;
				if (isInsideDir(attachmentsFolderPath, oldPath)) await fs.remove(oldPath);
			}
		}

		// Ensure the attachment folder exists (recursive to create parent FILES_PATH if missing)
		await fs.ensureDir(attachmentsFolderPath);

		// Save the attachment locally (await the write)
		await fs.writeFile(destination, new Uint8Array(attachmentBuffer));

		logger(`Attachment saved to ${destination}`);

		// Update the attachment path in the database if it already exists
		const existingAttachment = await prisma.attachment.findFirst({
			where: {
				taskId: task.id,
				path: storedName,
				description: attachmentDescription,
			},
		});

		if (existingAttachment) {
			await prisma.attachment.updateMany({
				where: {
					taskId: task.id,
					path: storedName,
				},
				data: {
					id: randomUUID(),
					taskId: task.id,
					type: type,
					description: attachmentDescription,
				},
			});

			response = existingAttachment;
			logger(`Replaced attachment ${storedName} for task ${task.id}`);
		} else {
			const addedAttachment = await prisma.attachment.create({
				data: {
					id: randomUUID(),
					taskId: task.id,
					type: type,
					path: storedName,
					description: attachmentDescription,
				},
			});
			response = addedAttachment;
		}
	} catch (error: any) {
		logger(error?.message ? error.message : "Error saving attachment");
		// Rejections are the caller's business - a silently dropped upload looks like success
		if (error instanceof AttachmentError) throw error;
	}
	return response;
}
