"use server";

import prisma from "@/prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { recordTaskHistory } from "./recordTaskHistory";

export default async function completeTask(prevState: any, formData: FormData) {
	// const rawData = Object.fromEntries(f.entries());
	// console.log(rawData);

	// Define the Zod schema for the form data
	const schema = z.object({
		taskId: z.string(),
		completeComment: z.string().min(4, {message: "Comment must be longer than 4 characters."}).max(200, { message: "Comment must be at most 200 characters." }),
		userId: z.string().length(25, { message: "User is required." }),
	});

	try {
		// Parse the form data using the schema
		// If validation fails, an error will be thrown and caught in the catch block
		const data = schema.parse({
			taskId: formData.get("taskId") as string,
			completeComment: formData.get("completeComment") as string,
			userId: formData.get("userId") as string,
		});

		// Get the user the task is assigned to and check that the userId is the user the task is assigned to
		const task = await prisma.task.findUnique({
			where: { id: Number(data.taskId) },
			include: { assignedToUser: { select: { firstName: true, lastName: true, id: true } } },
		});

		if (task?.assignedToUser?.id !== data.userId) {
			return { message: "You are not the user this task is assigned to." };
		}

		// Close the task
		const completedTask = await prisma.task.update({
			where: { id: Number(data.taskId) },
			data: {
				statusId: 2,
				closedOn: new Date(),
			},
		});

		const completeComment = `Task completed by ${task.assignedToUser.firstName} ${task.assignedToUser.lastName}${
			data.completeComment ? `: ${data.completeComment}` : "."
		}`;

		// Add the changes to the task history
		const newChange = await recordTaskHistory(completedTask, task.assignedToUser, [completeComment]);

		// Redirect to the task page, either for the updated task or the new task
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
