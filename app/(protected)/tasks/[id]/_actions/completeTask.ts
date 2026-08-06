"use server";

import { PERMISSION_DENIED, canCompleteTask, getActor, getTaskForAuth } from "@/actions/auth/require-auth";
import { EmailResponse, sendEmail } from "@/app/email/email";
import getUserDetails from "@/app/users/_actions/getUserById";
import logger from "@/lib/logging";
import prisma from "@/prisma/client";
import { redirect } from "next/navigation";
import { z } from "zod";
import updateUserStats from "../../_actions/updateUserStats";
import { recordTaskHistory } from "./recordTaskHistory";

export default async function completeTask(prevState: any, formData: FormData) {
	// const rawData = Object.fromEntries(f.entries());
	// console.log(rawData);

	// Check user permissions
	const actor = await getActor();
	if (!actor) return { message: PERMISSION_DENIED };

	// Define the Zod schema for the form data.
	// No "userId" field: the check below used to compare the task's assignee against a form value,
	// so posting the assignee's (or an admin's) id let anyone complete any task.
	const schema = z.object({
		taskId: z.string(),
		completeComment: z.string().min(4, { message: "Comment must be at least 4 characters." }).max(1000, { message: "Comment must be at most 1000 characters." }),
	});

	let emailStatus: EmailResponse | undefined;
	try {
		// Parse the form data using the schema
		// If validation fails, an error will be thrown and caught in the catch block
		const data = schema.parse({
			taskId: formData.get("taskId") as string,
			completeComment: formData.get("completeComment") as string,
		});

		// Only an admin or the assignee may complete a task
		const taskForAuth = await getTaskForAuth(Number(data.taskId));
		if (!taskForAuth) return { message: "Task not found." };
		if (!canCompleteTask(taskForAuth, actor)) {
			return { message: "You are not authorized to complete this task." };
		}

		// The editor is always the signed-in user
		const editor = await getUserDetails(actor.user.id);

		// Close the task
		const completedTask = await prisma.task.update({
			where: { id: Number(data.taskId) },
			data: {
				statusId: 2,
				completedOn: new Date(),
				completionComment: data.completeComment,
			},
			include: { assignedToUser: { select: { email: true, firstName: true, manager: { select: { email: true, firstName: true, lastName: true } } } } },
		});

		// Add the comment to the task history
		const completeComment = `Task completed by ${editor.firstName} ${editor.lastName}${data.completeComment ? `: ${data.completeComment}` : "."}`;
		const newChange = await recordTaskHistory(completedTask, editor, [completeComment]);

		// Update the user stats
		await updateUserStats(actor.user.id, "complete", completedTask);

		// Only send the email to the manager, if there is a manager
		if (completedTask.assignedToUser && completedTask.assignedToUser.manager) {
			// Email the manager
			emailStatus = await sendEmail({
				recipients: completedTask.assignedToUser.manager.email,
				emailType: "taskCompleted",
				userFirstName: editor.firstName,
				userLastName: editor.lastName,
				comment: completedTask.completionComment!,
				task: completedTask,
			});

			// If email wasn't sent
			if (!emailStatus || emailStatus.queued === false) logger("Task completed, email error");
			else {
				logger("Task completed, email sent");

				const completedTask = await prisma.task.update({
					where: { id: Number(data.taskId) },
					data: {
						lastReadyForReviewSentOn: new Date(),
					},
				});
			}
		}
	} catch (error) {
		// Handle Zod validation errors - return the message attribute back to the client
		if (error instanceof z.ZodError) for (const subError of error.errors) return { message: subError.message };
		// Handle other errors
		else return { message: (error as any).message };
	}
	redirect(
		`/tasks/${formData.get("taskId")}${emailStatus?.queued === false ? "?toastManager=fail" : emailStatus?.queued ? "?toastManager=success" : ""}${
			emailStatus?.id ? `&emailId=${emailStatus.id}` : ""
		}`
	);
}
