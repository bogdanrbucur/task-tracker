// server function to add new task
"use server";

import { PERMISSION_DENIED, canEditTask, getActor, getTaskForAuth } from "@/actions/auth/require-auth";
import { EmailResponse } from "@/app/email/email";
import getUserDetails from "@/app/users/_actions/getUserById";
import { MAX_DESCRIPTION_LENGTH, MIN_DESCRIPTION_LENGTH } from "@/lib/richText";
import logger from "@/lib/logging";
import prisma from "@/prisma/client";
import { Task } from "@prisma/client";
import { redirect } from "next/navigation";
import { z } from "zod";
import { ChecklistItemsInput, ChecklistItemInputType } from "../../_actions/checklistShared";
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
	parentId: number | null;
	checklistItems: ChecklistItemInputType[];
	copyFromTaskId?: number;
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
		parentId: z.string().nullable(),
		checklistItems: z.string().nullable(),
		copyFromTaskId: z.string().nullable(),
	});

	let newTask: Task | null = null;
	let emailStatus: EmailResponse | undefined;
	try {
		// Parse the form data using the schema
		// If validation fails, an error will be thrown and caught in the catch block
		const rawData = schema.parse({
			id: formData.get("taskId") as string,
			title: formData.get("title") as string,
			description: formData.get("description") as string,
			dueDate: formData.get("dueDate") as string,
			assignedToUserId: formData.get("assignedToUserId") as string,
			source: formData.get("source") as string,
			sourceLink: formData.get("sourceLink") as string,
			sourceAttachmentsDescriptions: formData.getAll("sourceAttachmentsDescriptions") as string[],
			parentId: formData.get("parentId") as string | null,
			checklistItems: formData.get("checklistItems") as string | null,
			copyFromTaskId: formData.get("copyFromTaskId") as string | null,
		});

		// checklistItems arrives as a JSON string built client-side by ChecklistEditor
		let checklistItems: ChecklistItemInputType[] = [];
		if (rawData.checklistItems) {
			let parsed: unknown;
			try {
				parsed = JSON.parse(rawData.checklistItems);
			} catch {
				return { message: "Invalid checklist data." };
			}
			checklistItems = ChecklistItemsInput.parse(parsed);
		}

		const parentIdRaw = rawData.parentId ? Number(rawData.parentId) : null;
		const copyFromTaskId = rawData.copyFromTaskId ? Number(rawData.copyFromTaskId) : undefined;

		const data = {
			...rawData,
			parentId: parentIdRaw,
			checklistItems,
			copyFromTaskId,
		};

		// A parent must: exist, have no parent of its own (one level deep), still be open, and be
		// editable by this actor. Trusting a client-submitted parentId without re-checking all of
		// this would let anyone nest tasks arbitrarily or attach to a finished/foreign task.
		if (data.parentId !== null) {
			const parentTask = await prisma.task.findUnique({
				where: { id: data.parentId },
				select: { id: true, statusId: true, parentId: true, assignedToUserId: true, assignedToUser: { select: { managerId: true } } },
			});
			const parentEligible =
				!!parentTask && parentTask.parentId === null && (parentTask.statusId === 1 || parentTask.statusId === 5) && canEditTask({ ...parentTask, parent: null, _count: { children: 0 } }, actor);
			if (!parentEligible) return { message: "The selected parent task is not available." };
		}

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

			// A task that already has sub-tasks of its own may not also become someone else's child -
			// the hierarchy is exactly one level deep. Checked against every child (not just open
			// ones, unlike the _count on taskForAuth, which is scoped to the unrelated
			// canCompleteTask gate), and separately from a task being its own parent.
			if (data.parentId !== null) {
				if (data.parentId === Number(taskData.id)) return { message: "A task cannot be its own parent." };
				const childCount = await prisma.task.count({ where: { parentId: Number(taskData.id) } });
				if (childCount > 0) return { message: "A task with sub-tasks cannot also be made a sub-task." };
			}

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
