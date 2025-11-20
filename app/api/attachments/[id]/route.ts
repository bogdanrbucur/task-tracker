// GET route to download attachments by their ID

import { getAuth } from "@/actions/auth/get-auth";
import prisma from "@/prisma/client";
import fs from "fs-extra";
import { notFound } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, context: any) {
// Support both typed and promise-style params (some Next.js types use Promise<{...}>)
	const resolvedParams = (await context.params) || context.params;
	const params = resolvedParams as { id: string };

	// Check user permissions
	const { user } = await getAuth();
	if (!user) return notFound();

	const {id} = await params;

	// search for the attachment in the database by its id
	const attachment = await prisma.attachment.findFirst({
		where: {
			id: id,
		},
	});

	// If the attachment is not found, return a 404
	if (!attachment) return notFound();

	// Using the taskId, search for the attachment in the filesystem
	const files = await fs.readdir(`${process.env.FILES_PATH}/attachments/${attachment.taskId}`);

	// Read the file from the filesystem
	const fileName = files.find((file) => file.includes(attachment.path));

	if (!fileName) return notFound();

	// Read the file content from the filesystem
	const filePath = `${process.env.FILES_PATH}/attachments/${attachment.taskId}/${fileName}`;
	const fileContent = await fs.readFile(filePath);

	// Return the file as a response
	return new NextResponse(fileContent, {
		headers: {
			"Content-Type": "application/octet-stream",
			"Content-Disposition": `attachment; filename="${attachment.path}"`,
			Status: "201",
		},
	});
}
