"use server";

import getUserPropsById from "@/app/users/getUserById";
import prisma from "@/prisma/client";
import { z } from "zod";
import { recordTaskHistory } from "./recordTaskHistory";
import { revalidatePath } from "next/cache";

export default async function closeTask(formData: FormData) {
	// const rawData = Object.fromEntries(f.entries());
	// console.log(rawData);

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

		if (task?.assignedToUser?.managerId !== data.userId) {
			return { message: "You are not the manager of the user this task is assigned to." };
		}

		// Close the task
		const closedTask = await prisma.task.update({
			where: { id: Number(data.taskId) },
			data: {
				statusId: 3,
				closedOn: new Date(),
			},
		});

		const closingComment = `Task closed by ${task.assignedToUser.manager!.firstName} ${task.assignedToUser.manager!.lastName}${
			data.closeComment ? `: ${data.closeComment}` : "."
		}`;

		// Add the changes to the task history
		const newChange = await recordTaskHistory(closedTask, task.assignedToUser.manager!, [closingComment]);

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
