// server function to add new task
"use server";

import getUserDetails from "@/app/users/getUserById";
import { Task } from "@prisma/client";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createTask } from "./createTask";
import { updateTask } from "../[id]/updateTask";
import { EmailResponse } from "@/app/email/email";

export type NewTask = {
	title: string;
	description: string;
	dueDate: string;
	createdByUserId: string;
	assignedToUserId: string;
};
export type UpdateTask = NewTask & { id: string };
export type Editor = { firstName: string; lastName: string; id: string };

export default async function submitTask(prevState: any, formData: FormData) {
	// const rawFormData = Object.fromEntries(formData.entries());
	// console.log(rawFormData);

	// Define the Zod schema for the form data
	const schema = z.object({
		id: z.string().nullable(),
		title: z.string().min(10, { message: "Title must be at least 10 characters." }).max(100, { message: "Title must be at most 100 characters." }),
		description: z.string().min(20, { message: "Description must be at least 20 characters." }).max(500, { message: "Description must be at most 500 characters." }),
		dueDate: z.string().datetime({ message: "Due date is required." }),
		assignedToUserId: z.string().length(25, { message: "Assigned user is required." }),
		createdByUserId: z.string().length(25),
	});

	let newTask: Task | null = null;
	let emailStatus: EmailResponse | undefined;
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

		// Get the created by user object by the ID
		const editingUser = await getUserDetails(data.createdByUserId);

		// If a task ID is provided, update the existing task
		if (data.id) {
			const { updatedTask: updatedTask, emailStatus: statusTempVar } = await updateTask(data as UpdateTask, editingUser!);
			newTask = updatedTask;
			emailStatus = statusTempVar;
		} else {
			// If no task ID is provided, create a new task
			const { newTask: createdTask, emailStatus: statusTempVar } = await createTask(data as NewTask, editingUser!);
			newTask = createdTask;
			emailStatus = statusTempVar;
		}

		// if (!emailStatus) {
		// 	console.log("Task updated, but user not changed, no email sent");
		// 	// redirect(newTask ? `/tasks/${String(newTask.id)}` : "");
		// 	// return;
		// }

		// // If the email sent failed
		// else if (emailStatus && !emailStatus.success) {
		// 	console.log("Task assigned user changed, email error");
		// 	// redirect(newTask ? `/tasks/${String(newTask.id)}?toast=fail` : "");
		// 	// return;
		// 	// Else it succeded
		// } else {
		// 	console.log("Task assigned user changed, email sent");
		// 	// redirect(newTask ? `/tasks/${String(newTask.id)}?toast=success` : "");
		// 	// return;
		// }
		// console.log(emailStatus);

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
		console.log(emailStatus);
		redirect(newTask ? `/tasks/${String(newTask.id)}` : "");
	}
}
