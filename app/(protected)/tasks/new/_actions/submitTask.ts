// server function to add new task
"use server";

import { PERMISSION_DENIED, canEditTask, getActor, getTaskForAuth } from "@/actions/auth/require-auth";
import { EmailResponse } from "@/app/email/email";
import getUserDetails from "@/app/users/_actions/getUserById";
import { MAX_DESCRIPTION_LENGTH, MIN_DESCRIPTION_LENGTH } from "@/lib/richText";
import logger from "@/lib/logging";
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
	// logger("raw data", rawFormData);

	// Check user permissions
	const actor = await getActor();
	if (!actor) return { message: PERMISSION_DENIED };
	const { user: agent } = actor;

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
		description: z
			.string()
			.min(MIN_DESCRIPTION_LENGTH, { message: `Description must be at least ${MIN_DESCRIPTION_LENGTH} characters.` })
			.max(MAX_DESCRIPTION_LENGTH, { message: `Description must be at most ${MAX_DESCRIPTION_LENGTH} characters.` }),
		dueDate: z.string().datetime({ message: "Due date is required." }),
		assignedToUserId: z.string().length(25, { message: "Assigned user is required." }),
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
			source: formData.get("source") as string,
			sourceLink: formData.get("sourceLink") as string,
			sourceAttachmentsDescriptions: formData.getAll("sourceAttachmentsDescriptions") as string[],
		});

		// The editor is the session user, never a form field. createdByUserId used to come from the
		// form ("editingUser"), which let the creator of a task be attributed to anyone.
		const editingUser = await getUserDetails(agent.id);
		const taskData = { ...data, createdByUserId: agent.id };

		// If a task ID is provided, update the existing task
		if (taskData.id) {
			// Editing an existing task is not something every signed-in user may do. The edit page
			// already gates this; the action has to enforce the same rule independently.
			const taskForAuth = await getTaskForAuth(Number(taskData.id));
			if (!taskForAuth) return { message: "Task not found." };
			if (!canEditTask(taskForAuth, actor)) return { message: PERMISSION_DENIED };

			// For some retarded reason, the descriptions are return as an array of the same string, so we split the first one
			const attachmentsDescriptions = taskData.sourceAttachmentsDescriptions![0] ? taskData.sourceAttachmentsDescriptions![0].split(",") : [];
			logger(`attDescriptions: ${attachmentsDescriptions}`);
			const { updatedTask: updatedTask, emailStatus: statusTempVar } = await updateTask(taskData as UpdateTask, editingUser!, attachmentsDescriptions);
			newTask = updatedTask;
			emailStatus = statusTempVar;
		} else {
			// If no task ID is provided, create a new task
			const { newTask: createdTask, emailStatus: statusTempVar } = await createTask(taskData as NewTask, editingUser!);
			newTask = createdTask;
			emailStatus = statusTempVar;
		}

		// If email wasn't sent
		if (!emailStatus) logger("Task updated, but user not changed, no email sent");
		// If the email sent failed
		else if (emailStatus?.queued === false) logger("Task assigned user changed, email error");
		else logger("Task assigned user changed, email sent");

		// Redirect to the task page, either for the updated task or the new task
	} catch (error) {
		// Handle Zod validation errors - return the message attribute back to the client
		if (error instanceof z.ZodError) for (const subError of error.errors) return { message: subError.message };
		// Handle other errors
		else return { message: (error as any).message };
	}

	redirect(
		newTask
			? `/tasks/${String(newTask.id)}${emailStatus?.queued === false ? "?toastUser=fail" : emailStatus?.queued ? "?toastUser=success" : ""}${
					emailStatus?.id ? `&emailId=${emailStatus.id}` : ""
			  }`
			: ""
	);
}
