// DELETE route to remove attachments by their ID

import { getAuth } from "@/actions/auth/get-auth";
import prisma from "@/prisma/client";
import fs from "fs-extra";
import { notFound } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";

// Endpoint to delete an attachment
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
	// Check user permissions
	const { user } = await getAuth();
	if (!user) return NextResponse.json({ message: "Permission denied." });

	// search for the attachment in the database by its id
	const attachment = await prisma.attachment.findFirst({
		where: {
			id: params.id,
		},
	});

	// If the attachment is not found, return a 404
	if (!attachment) return notFound();

	// Using the taskId, search for the attachment in the filesystem
	const files = await fs.readdir(`${process.env.FILES_PATH}/attachments/${attachment.taskId}`);

	// Delete the files
	for (const file of files) {
		if (file.includes(attachment.path)) {
			await fs.remove(`${process.env.FILES_PATH}/attachments/${attachment.taskId}/${file}`);
		}
	}

	// And remove the db entry
	await prisma.attachment.delete({
		where: {
			id: attachment.id,
		},
	});

	// Return a success response
	return NextResponse.json({ message: "Attachment deleted successfully", Status: "200" });
}
