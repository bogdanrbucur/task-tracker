import { getAuth } from "@/actions/auth/get-auth";
import prisma from "@/prisma/client";
import fs from "fs-extra";
import { notFound } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
	// Check user permissions
	const { user } = await getAuth();
	if (!user) {
		return notFound();
	}

	// search for the attachment in the database by its id
	const attachment = await prisma.attachment.findFirst({
		where: {
			id: params.id,
		},
	});

	// If the attachment is not found, return a 404
	if (!attachment) return notFound();

	// Using the taskId, search for the attachment in the filesystem
	const files = await fs.readdir(`./attachments/${attachment.taskId}`);

	// Read the file from the filesystem
	const fileName = files.find((file) => file.includes(attachment.path));

	if (!fileName) return notFound();

	// Read the file content from the filesystem
	const filePath = `./attachments/${attachment.taskId}/${fileName}`;
	const fileContent = await fs.readFile(filePath);

	// Return the file as a response
	return new NextResponse(fileContent, {
		headers: {
			"Content-Type": "application/octet-stream",
			"Content-Disposition": `attachment; filename="${attachment.path}"`,
		},
	});
}
