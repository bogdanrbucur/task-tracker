import { logger } from "@/lib/utilityFunctions";
import prisma from "@/prisma/client";
import { Task } from "@prisma/client";
import { randomUUID } from "crypto";
import fs from "fs-extra";

export default async function saveAttachment(attachment: File, task: Task, attachmentDescription: string, type: "source" | "completion") {
	let response;
	try {
		const arrayBuffer = await attachment.arrayBuffer();
		const attachmentBuffer = Buffer.from(arrayBuffer);

		// Check if the task has an attachment folder, and then check if the attachment already exists
		const attachmentsFolderPath = `${process.env.FILES_PATH}/attachments/${task.id}`;
		if (await fs.pathExists(attachmentsFolderPath)) {
			const attachments = await fs.readdir(attachmentsFolderPath);
			const oldattachment = attachments.find((file) => file.includes(String(`${type}_${attachment.name}`)));
			if (oldattachment) await fs.remove(`${attachmentsFolderPath}/${oldattachment}`);
		}

		// If the task doesn't have an attachment folder, create one
		else await fs.mkdir(attachmentsFolderPath);

		// Save the attachment locally
		fs.writeFile(`${process.env.FILES_PATH}/attachments/${task.id}/${type}_${attachment.name}`, new Uint8Array(attachmentBuffer));

		logger(`Attachment saved to ${process.env.FILES_PATH}/attachments/${task.id}/${type}_${attachment.name}`);

		// Update the attachment path in the database if it already exists
		const existingAttachment = await prisma.attachment.findFirst({
			where: {
				taskId: task.id,
				path: `${type}_${attachment.name}`,
				description: attachmentDescription,
			},
		});

		if (existingAttachment) {
			await prisma.attachment.updateMany({
				where: {
					taskId: task.id,
					path: `${type}_${attachment.name}`,
				},
				data: {
					id: randomUUID(),
					taskId: task.id,
					type: type,
					description: attachmentDescription,
				},
			});

			response = existingAttachment;
			logger(`Replaced attachment ${type}_${attachment.name} for task ${task.id}`);
		} else {
			const addedAttachment = await prisma.attachment.create({
				data: {
					id: randomUUID(),
					taskId: task.id,
					type: type,
					path: `${type}_${attachment.name}`,
					description: attachmentDescription,
				},
			});
			response = addedAttachment;
		}
	} catch (error: any) {
		logger(error?.message ? error.message : "Error saving attachment");
	}
	return response;
}
