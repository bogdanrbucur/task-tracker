"use server";

import { PERMISSION_DENIED, canManageTask, getActor, getTaskForAuth } from "@/actions/auth/require-auth";
import { EmailResponse, sendEmail } from "@/app/email/email";
import getUserDetails from "@/app/users/_actions/getUserById";
import logger from "@/lib/logging";
import { checkIfTaskOverdue } from "@/lib/utilityFunctions";
import prisma from "@/prisma/client";
import { redirect } from "next/navigation";
import { z } from "zod";
import updateUserStats from "../../_actions/updateUserStats";
import { recordTaskHistory } from "./recordTaskHistory";

export default async function reopenTask(prevState: any, formData: FormData) {
	// const rawData = Object.fromEntries(f.entries());
	// logger(rawData);

	// Check user permissions
	const actor = await getActor();
	if (!actor) return { message: PERMISSION_DENIED };

	// Define the Zod schema for the form data.
	// No "userId" field: the actor comes from the session, never from the client.
	const schema = z.object({
		taskId: z.string(),
		reopenComment: z.string().min(10, { message: "Comment must be at least 10 characters." }).max(200, { message: "Comment must be at most 200 characters." }),
	});

	let emailStatus: EmailResponse | undefined;
	try {
		// Parse the form data using the schema
		// If validation fails, an error will be thrown and caught in the catch block
		const data = schema.parse({
			taskId: formData.get("taskId") as string,
			reopenComment: formData.get("reopenComment") as string,
		});

		// Get the user the task is assigned to and check that the userId is the manager of the user the task is assigned to
		const task = await prisma.task.findUnique({
			where: { id: Number(data.taskId) },
			include: { assignedToUser: { select: { managerId: true, manager: { select: { firstName: true, lastName: true, id: true } } } } },
		});

		// Temporary store the task completion date to compute user stats
		const taskCompletionDate = task?.completedOn;

		// Only an admin or the assignee's manager may reopen a task
		const taskForAuth = await getTaskForAuth(Number(data.taskId));
		if (!taskForAuth) return { message: "Task not found." };
		if (!canManageTask(taskForAuth, actor)) return { message: "You are not authorized to reopen this task." };

		// Get the details of the user who is reopening the task
		const editor = await getUserDetails(actor.user.id);

		// Reopen the task
		const reopenedTask = await prisma.task.update({
			where: { id: Number(data.taskId) },
			data: {
				statusId: 1,
				closedOn: null,
				completedOn: null,
			},
			include: { assignedToUser: { select: { email: true, firstName: true, manager: { select: { email: true, firstName: true, lastName: true } } } } },
		});
		// Check if the task is overdue
		await checkIfTaskOverdue(reopenedTask.id);

		// Add the changes to the task history
		const reopenComment = `Task reopened by ${editor.firstName} ${editor.lastName}${data.reopenComment ? `: ${data.reopenComment}` : "."}`;
		const newChange = await recordTaskHistory(reopenedTask, editor, [reopenComment]);

		// Replace the task completion date with the temporary value
		reopenedTask.completedOn = taskCompletionDate!;

		// Update the user stats if reopening a completed task
		if (task?.statusId === 2) await updateUserStats(actor.user.id, "reopen", reopenedTask);

		// Email the user the task is assigned to
		emailStatus = await sendEmail({
			recipients: reopenedTask.assignedToUser ? reopenedTask.assignedToUser.email : "",
			emailType: "taskReopened",
			userFirstName: editor.firstName,
			userLastName: editor.lastName,
			comment: data.reopenComment,
			task: reopenedTask,
		});

		// If email wasn't sent
		if (!emailStatus || emailStatus.queued === false) logger("Task reopened, email error");
		// If the email sent failed
		else logger("Task reopened, email sent");
	} catch (error) {
		// Handle Zod validation errors - return the message attribute back to the client
		if (error instanceof z.ZodError) for (const subError of error.errors) return { message: subError.message };
		// Handle other errors
		else return { message: (error as any).message };
	}
	redirect(
		`/tasks/${formData.get("taskId")}${emailStatus?.queued === false ? "?toastUser=fail" : emailStatus?.queued ? "?toastUser=success" : ""}${
			emailStatus?.id ? `&emailId=${emailStatus.id}` : ""
		}`
	);
}
