// DELETE route to remove attachments by their ID

import { canModifyTaskAttachments, getActor, getTaskForAuth } from "@/actions/auth/require-auth";
import { isInsideDir, taskAttachmentsDir } from "@/lib/attachments";
import prisma from "@/prisma/client";
import fs from "fs-extra";
import { notFound } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";

// Endpoint to delete an attachment
export async function DELETE(req: NextRequest, context: any) {
	// Support both typed and promise-style params (some Next.js types use Promise<{...}>)
	const resolvedParams = (await context.params) || context.params;
	const params = resolvedParams as { id: string };

	// Check user permissions
	const actor = await getActor();
	if (!actor) return NextResponse.json({ message: "Permission denied." }, { status: 401 });

	// search for the attachment in the database by its id
	const attachment = await prisma.attachment.findFirst({
		where: {
			id: params.id,
		},
	});

	// If the attachment is not found, return a 404
	if (!attachment) return notFound();

	// Deleting is a write: being signed in is not enough, the caller must be able to edit the task
	const taskForAuth = await getTaskForAuth(attachment.taskId);
	if (!taskForAuth || !canModifyTaskAttachments(taskForAuth, actor, attachment.type as "source" | "completion")) {
		return NextResponse.json({ message: "Permission denied." }, { status: 403 });
	}

	// Using the taskId, search for the attachment in the filesystem
	const attachmentsDir = taskAttachmentsDir(attachment.taskId);
	const files = (await fs.pathExists(attachmentsDir)) ? await fs.readdir(attachmentsDir) : [];

	// Delete the files. Exact match first, falling back to the legacy substring behaviour for rows
	// written before filenames were sanitised.
	const matches = files.filter((file) => file === attachment.path);
	if (matches.length === 0) matches.push(...files.filter((file) => file.includes(attachment.path)));

	for (const file of matches) {
		const filePath = `${attachmentsDir}/${file}`;
		if (isInsideDir(attachmentsDir, filePath)) await fs.remove(filePath);
	}

	// And remove the db entry
	await prisma.attachment.delete({
		where: {
			id: attachment.id,
		},
	});

	// Return a success response
	return NextResponse.json({ message: "Attachment deleted successfully" }, { status: 200 });
}
