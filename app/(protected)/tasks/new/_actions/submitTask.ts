// server function to add new task
"use server";

import { getAuth } from "@/actions/auth/get-auth";
import { EmailResponse } from "@/app/email/email";
import getUserDetails from "@/app/users/_actions/getUserById";
import { Task } from "@prisma/client";
import { redirect } from "next/navigation";
import { z } from "zod";
import { updateTask } from "../../[id]/_actions/updateTask";
import { createTask } from "./createTask";

export type NewTask = {
	title: string;
	description: string;
	dueDate: string;
	createdByUserId: string;
	assignedToUserId: string;
	source?: string;
	sourceLink?: string;
};
export type UpdateTask = NewTask & { id: string };
export type Editor = { firstName: string; lastName: string; id: string };

const Attachment = z.object({
	size: z.number(),
	type: z.string(),
	name: z.string(),
	lastModified: z.number(),
});

export type Attachment = z.infer<typeof Attachment>;

export default async function submitTask(prevState: any, formData: FormData) {
	// const rawFormData = Object.fromEntries(formData.entries());
	// console.log("raw data", rawFormData);

	// Check user permissions
	const { user: agent } = await getAuth();
	if (!agent) return { message: "You do not have permission to perform this action." };

	const isValidURL = (url: string): boolean => {
		try {
			new URL(url);
			return true;
		} catch (_) {
			return false;
		}
	};

	// Define the Zod schema for the form data
	const schema = z.object({
		id: z.string().nullable(),
		title: z.string().min(10, { message: "Title must be at least 10 characters." }).max(100, { message: "Title must be at most 100 characters." }),
		description: z.string().min(20, { message: "Description must be at least 20 characters." }).max(4096, { message: "Description must be at most 4096 characters." }),
		dueDate: z.string().datetime({ message: "Due date is required." }),
		assignedToUserId: z.string().length(25, { message: "Assigned user is required." }),
		createdByUserId: z.string().length(25),
		source: z.string().max(100, { message: "Source must be at most 100 characters." }).optional(),
		sourceLink: z
			.string()
			.max(255, { message: "Source link must be at most 255 characters." })
			.optional()
			.refine((url) => !url || isValidURL(url), {
				message: "Invalid Source link URL",
			}),
		sourceAttachmentsDescriptions: z.array(z.string()).nullable(),
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
			source: formData.get("source") as string,
			sourceLink: formData.get("sourceLink") as string,
			sourceAttachmentsDescriptions: formData.getAll("sourceAttachmentsDescriptions") as string[],
		});

		// Get the created by user object by the ID
		const editingUser = await getUserDetails(data.createdByUserId);

		// If a task ID is provided, update the existing task
		if (data.id) {
			// For some retarded reason, the descriptions are return as an array of the same string, so we split the first one
			const attachmentsDescriptions = data.sourceAttachmentsDescriptions![0] ? data.sourceAttachmentsDescriptions![0].split(",") : [];
			console.log("attDescriptions:", attachmentsDescriptions);
			const { updatedTask: updatedTask, emailStatus: statusTempVar } = await updateTask(data as UpdateTask, editingUser!, attachmentsDescriptions);
			newTask = updatedTask;
			emailStatus = statusTempVar;
		} else {
			// If no task ID is provided, create a new task
			const { newTask: createdTask, emailStatus: statusTempVar } = await createTask(data as NewTask, editingUser!);
			newTask = createdTask;
			emailStatus = statusTempVar;
		}

		// If email wasn't sent
		if (!emailStatus) console.log("Task updated, but user not changed, no email sent");
		// If the email sent failed
		else if (emailStatus && !emailStatus.success) console.log("Task assigned user changed, email error");
		else console.log("Task assigned user changed, email sent");

		// Redirect to the task page, either for the updated task or the new task
	} catch (error) {
		// Handle Zod validation errors - return the message attribute back to the client
		if (error instanceof z.ZodError) {
			for (const subError of error.errors) {
				return { message: subError.message };
			}
		}
		// Handle other errors
		else return { message: (error as any).message };
	}
	console.log(emailStatus);
	redirect(newTask ? `/tasks/${String(newTask.id)}${emailStatus && !emailStatus.success ? "?toastUser=fail" : emailStatus ? "?toastUser=success" : ""}` : "");
}
