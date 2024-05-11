// server function to add new task
"use server";

import prisma from "@/prisma/client";
import { Task } from "@prisma/client";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createTask } from "../createTask";
import { updateTask } from "../updateTask";

export type NewTask = {
	title: string;
	description: string;
	dueDate: string;
	createdByUserId: string;
	assignedToUserId: string;
};
export type UpdateTask = NewTask & { id: string };
export type Creator = { firstName: string; lastName: string; id: string };

export default async function submitTask(prevState: any, formData: FormData) {
	// const formRawData = Object.fromEntries(formData.entries());
	// console.log(formRawData);

	// Define the Zod schema for the form data
	const schema = z.object({
		id: z.string().nullable(),
		title: z.string().min(10, { message: "Title must be at least 10 characters." }).max(100, { message: "Title must be at most 100 characters." }),
		description: z.string().min(20, { message: "Description must be at least 20 characters." }).max(500, { message: "Description must be at most 500 characters." }),
		dueDate: z.string().datetime({ message: "Due date is required." }),
		assignedToUserId: z.string().length(15, { message: "Assigned user is required." }),
		createdByUserId: z.string().length(15),
	});

	let newTask: Task | null = null;
	try {
		// Parse the form data using the schema
		// If validation fails, an error will be thrown and caught in the catch block
		const data = schema.parse({
			id: formData.get("taskId") as string,
			title: formData.get("title") as string,
			description: formData.get("description") as string,
			dueDate: formData.get("dueDate") as string,
			assignedToUserId: formData.get("assignedToUserId") as string,
			createdByUserId: formData.get("editingUser") as string,
		});
		// console.log(data);

		// Get the created by user object by the ID
		const editingUser = await prisma.user.findUnique({
			where: { id: data.createdByUserId },
			select: { firstName: true, lastName: true, id: true },
		});

		// If a task ID is provided, update the existing task
		if (data.id) newTask = await updateTask(data as UpdateTask, editingUser!);
		// If no task ID is provided, create a new task
		else newTask = await createTask(data as NewTask, editingUser!);

		// console.log(newTask);

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
	redirect(newTask ? `/tasks/${String(newTask.id)}` : "");
}
