// POST route to add attachments to tasks, given the task ID

import { getAuth } from "@/actions/auth/get-auth";
import saveAttachment from "@/app/(protected)/tasks/[id]/_actions/saveAttachment";
import prisma from "@/prisma/client";
import { notFound } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
	const { user } = await getAuth();
	if (!user) return notFound();

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

	// Parse the incoming request
	const form = await req.formData();
	const files = form.getAll("file") as File[];
	const descriptions = form.getAll("description");

	// Call saveAttachment(att, task, attDescription) to save the attachment
	const attachments = [];
	for (const [index, file] of files.entries()) {
		const addedAttachment = await saveAttachment(file, task, descriptions[index] as string, type);
		attachments.push(addedAttachment);
	}
	return NextResponse.json(attachments);
}
