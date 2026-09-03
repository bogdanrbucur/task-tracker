// POST route to add attachments to tasks, given the task ID

import { canModifyTaskAttachments, getActor, getTaskForAuth } from "@/actions/auth/require-auth";
import saveAttachment, { AttachmentError } from "@/app/(protected)/tasks/[id]/_actions/saveAttachment";
import prisma from "@/prisma/client";
import { notFound } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
	const actor = await getActor();
	if (!actor) return notFound();

	const searchParams = req.nextUrl.searchParams;
	const taskId = searchParams.get("id");
	const type = searchParams.get("type");

	// return Bad Request if the task ID or type is not provided or wrong type
	if (type !== "source" && type !== "completion") {
		return NextResponse.json({ error: "Invalid attachment type" }, { status: 400 });
	}

	// Search for the task in the database by its id
	const task = await prisma.task.findFirst({
		where: {
			id: Number(taskId),
		},
	});

	// If the task is not found, return a 404
	if (!task) return notFound();

	// Being signed in is not enough - only someone who may edit this task may attach to it
	const taskForAuth = await getTaskForAuth(task.id);
	if (!taskForAuth || !canModifyTaskAttachments(taskForAuth, actor, type)) {
		return NextResponse.json({ error: "Permission denied" }, { status: 403 });
	}

	// Parse the incoming request
	const form = await req.formData();
	const files = form.getAll("file") as File[];
	const descriptions = form.getAll("description");

	// Call saveAttachment(att, task, attDescription) to save the attachment
	const attachments = [];
	try {
		for (const [index, file] of files.entries()) {
			const addedAttachment = await saveAttachment(file, task, descriptions[index] as string, type);
			attachments.push(addedAttachment);
		}
	} catch (error) {
		// Rejected filenames and oversized files are client errors, not server errors
		if (error instanceof AttachmentError) return NextResponse.json({ error: error.message }, { status: 400 });
		throw error;
	}
	return NextResponse.json(attachments);
}
