"use server";

import prisma from "@/prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { recordTaskHistory } from "./recordTaskHistory";
import getUserDetails from "@/app/users/getUserById";
import { checkIfTaskOverdue } from "@/lib/utilityFunctions";

export default async function reopenTask(prevState: any, formData: FormData) {
	// const rawData = Object.fromEntries(f.entries());
	// console.log(rawData);

	// Define the Zod schema for the form data
	const schema = z.object({
		taskId: z.string(),
		reopenComment: z.string().min(10, { message: "Comment must be at least 10 characters." }).max(200, { message: "Comment must be at most 200 characters." }),
		userId: z.string().length(25, { message: "User is required." }),
	});

	try {
		// Parse the form data using the schema
		// If validation fails, an error will be thrown and caught in the catch block
		const data = schema.parse({
			taskId: formData.get("taskId") as string,
			reopenComment: formData.get("reopenComment") as string,
			userId: formData.get("userId") as string,
		});

		// Get the user the task is assigned to and check that the userId is the manager of the user the task is assigned to
		const task = await prisma.task.findUnique({
			where: { id: Number(data.taskId) },
			include: { assignedToUser: { select: { managerId: true, manager: { select: { firstName: true, lastName: true, id: true } } } } },
		});

		// Get the details of the user who is reopening the task
		const editor = await getUserDetails(data.userId);
		if (task?.assignedToUser?.managerId !== editor.id && !editor.isAdmin) {
			return { message: "You are not authorized to reopen this task." };
		}

		// Reopen the task
		const reopenedTask = await prisma.task.update({
			where: { id: Number(data.taskId) },
			data: {
				statusId: 1,
				closedOn: null,
				completedOn: null,
			},
		});

		// Check if the task is overdue
		await checkIfTaskOverdue(reopenedTask.id);

		const reopenComment = `Task reopened by ${editor.firstName} ${editor.lastName}${data.reopenComment ? `: ${data.reopenComment}` : "."}`;

		// Add the changes to the task history
		const newChange = await recordTaskHistory(reopenedTask, editor, [reopenComment]);
	} catch (error) {
		// Handle Zod validation errors - return the message attribute back to the client
		if (error instanceof z.ZodError) {
			for (const subError of error.errors) {
				return { message: subError.message };
			}
		} else {
			// Handle other errors
			return { message: (error as any).message };
		}
	}
	revalidatePath(`/tasks/${formData.get("taskId")}`);
}
