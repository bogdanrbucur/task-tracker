"use server";
import { getActor } from "@/actions/auth/require-auth";
import prisma from "@/prisma/client";

export default async function getTaskAttachments(taskId: number) {
	// "use server" makes this a public endpoint - it had no session check at all, so anyone could
	// enumerate attachment ids and filenames for any task
	const actor = await getActor();
	if (!actor) return [];

	const attachments = await prisma.attachment.findMany({
		where: {
			taskId,
		},
	});
	return attachments;
}
