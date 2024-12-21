"use server";

import { getAuth } from "@/actions/auth/get-auth";
import getUserDetails from "@/app/users/_actions/getUserById";
import prisma from "@/prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import updateUserStats from "../../_actions/updateUserStats";
import { recordTaskHistory } from "./recordTaskHistory";

export default async function closeTask(prevState: any, formData: FormData) {
	// const rawData = Object.fromEntries(f.entries());
	// console.log(rawData);

	// Check user permissions
	const { user: agent } = await getAuth();
	if (!agent) return { message: "You do not have permission to perform this action." };

	// Define the Zod schema for the form data
	const schema = z.object({
		taskId: z.string(),
		closeComment: z.string().max(200, { message: "Comment must be at most 200 characters." }),
		userId: z.string().length(25, { message: "User is required." }),
	});

	try {
		// Parse the form data using the schema
		// If validation fails, an error will be thrown and caught in the catch block
		const data = schema.parse({
			taskId: formData.get("taskId") as string,
			closeComment: formData.get("closeComment") as string,
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
		await updateUserStats(data.userId, "close", closedTask);
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
