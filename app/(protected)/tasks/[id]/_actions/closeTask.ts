"use server";

import { PERMISSION_DENIED, canManageTask, getActor, getTaskForAuth } from "@/actions/auth/require-auth";
import getUserDetails from "@/app/users/_actions/getUserById";
import prisma from "@/prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import updateUserStats from "../../_actions/updateUserStats";
import { recordTaskHistory } from "./recordTaskHistory";

export default async function closeTask(prevState: any, formData: FormData) {
	// const rawData = Object.fromEntries(f.entries());
	// logger(rawData);

	// Check user permissions
	const actor = await getActor();
	if (!actor) return { message: PERMISSION_DENIED };

	// Define the Zod schema for the form data.
	// The actor is the session user - a "userId" field here was authorising whoever the client
	// claimed to be, so anyone could close any task by posting a manager's or admin's id.
	const schema = z.object({
		taskId: z.string(),
		closeComment: z.string().max(200, { message: "Comment must be at most 200 characters." }),
	});

	try {
		// Parse the form data using the schema
		// If validation fails, an error will be thrown and caught in the catch block
		const data = schema.parse({
			taskId: formData.get("taskId") as string,
			closeComment: formData.get("closeComment") as string,
		});

		// Only an admin or the assignee's manager may close a task
		const taskForAuth = await getTaskForAuth(Number(data.taskId));
		if (!taskForAuth) return { message: "Task not found." };
		if (!canManageTask(taskForAuth, actor)) return { message: "You are not authorized to close this task." };

		// The editor is always the signed-in user
		const editor = await getUserDetails(actor.user.id);

		// Close the task
		const closedTask = await prisma.task.update({
			where: { id: Number(data.taskId) },
			data: {
				statusId: 3,
				closedOn: new Date(),
			},
		});

		const closingComment = `Task closed by ${editor.firstName} ${editor.lastName}${data.closeComment ? `: ${data.closeComment}` : "."}`;

		// Add the changes to the task history
		const newChange = await recordTaskHistory(closedTask, editor, [closingComment]);

		// Update the user stats for closing the task
		await updateUserStats(actor.user.id, "close", closedTask);
	} catch (error) {
		// Handle Zod validation errors - return the message attribute back to the client
		if (error instanceof z.ZodError) for (const subError of error.errors) return { message: subError.message };
		// Handle other errors
		else return { message: (error as any).message };
	}
	revalidatePath(`/tasks/${formData.get("taskId")}`);
}
