// GET route to download attachments by their ID

import { getAuth } from "@/actions/auth/get-auth";
import { findAttachmentFile, isInsideDir, taskAttachmentsDir } from "@/lib/attachments";
import prisma from "@/prisma/client";
import fs from "fs-extra";
import { notFound } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, context: any) {
	// Support both typed and promise-style params (some Next.js types use Promise<{...}>)
	const resolvedParams = (await context.params) || context.params;
	const params = resolvedParams as { id: string };

	// Check user permissions. Reads are deliberately flat: any signed-in user may view any task,
	// so any signed-in user may download its attachments.
	const { user } = await getAuth();
	if (!user) return notFound();

	const { id } = await params;

	// search for the attachment in the database by its id
	const attachment = await prisma.attachment.findFirst({
		where: {
			id: id,
		},
	});

	// If the attachment is not found, return a 404
	if (!attachment) return notFound();

	// Using the taskId, search for the attachment in the filesystem
	const attachmentsDir = taskAttachmentsDir(attachment.taskId);
	if (!(await fs.pathExists(attachmentsDir))) return notFound();
	const files = await fs.readdir(attachmentsDir);

	// Read the file from the filesystem
	const fileName = findAttachmentFile(files, attachment.path);

	if (!fileName) return notFound();

	// Read the file content from the filesystem
	const filePath = `${attachmentsDir}/${fileName}`;
	if (!isInsideDir(attachmentsDir, filePath)) return notFound();
	const fileContent = await fs.readFile(filePath);

	// Return the file as a response
	return new NextResponse(new Uint8Array(fileContent), {
		headers: {
			"Content-Type": "application/octet-stream",
			// Quotes are escaped so a filename cannot break out of the header value
			"Content-Disposition": `attachment; filename="${attachment.path.replace(/"/g, "")}"`,
			// Never let the browser sniff a stored file into something executable
			"X-Content-Type-Options": "nosniff",
		},
	});
}
