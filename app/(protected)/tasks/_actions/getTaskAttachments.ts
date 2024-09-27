"use server";
import prisma from "@/prisma/client";

export default async function getTaskAttachments(taskId: number) {
	const attachments = await prisma.attachment.findMany({
		where: {
			taskId,
		},
	});
	return attachments;
}
