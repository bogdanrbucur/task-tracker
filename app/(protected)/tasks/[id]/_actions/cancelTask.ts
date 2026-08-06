"use server";

import { PERMISSION_DENIED, canManageTask, getActor, getTaskForAuth } from "@/actions/auth/require-auth";
import { EmailResponse, sendEmail } from "@/app/email/email";
import getUserDetails from "@/app/users/_actions/getUserById";
import logger from "@/lib/logging";
import prisma from "@/prisma/client";
import { redirect } from "next/navigation";
import { z } from "zod";
import updateUserStats from "../../_actions/updateUserStats";
import { recordTaskHistory } from "./recordTaskHistory";

export default async function cancelTask(prevState: any, formData: FormData) {
	// const rawData = Object.fromEntries(f.entries());
	// logger(rawData);

	// Check user permissions
	const actor = await getActor();
	if (!actor) return { message: PERMISSION_DENIED };

	// Define the Zod schema for the form data
	const schema = z.object({
		taskId: z.string(),
		cancelComment: z.string().min(10, { message: "Comment must be at least 10 characters." }).max(200, { message: "Comment must be at most 200 characters." }),
	});

	let emailStatus: EmailResponse | undefined;
	try {
		// Parse the form data using the schema
		// If validation fails, an error will be thrown and caught in the catch block
		const data = schema.parse({
			taskId: formData.get("taskId") as string,
			cancelComment: formData.get("cancelComment") as string,
		});

		// Only an admin or the assignee's manager may cancel a task - the same rule the task page
		// uses to decide whether to show the Cancel button
		const taskForAuth = await getTaskForAuth(Number(data.taskId));
		if (!taskForAuth) return { message: "Task not found." };
		if (!canManageTask(taskForAuth, actor)) return { message: "You are not authorized to cancel this task." };

		// The editor is always the signed-in user
		const editor = await getUserDetails(actor.user.id);

		// Close the task
		const cancelledTask = await prisma.task.update({
			where: { id: Number(data.taskId) },
			data: {
				statusId: 4,
			},
			include: { assignedToUser: { select: { email: true, firstName: true, manager: { select: { email: true, firstName: true, lastName: true } } } } },
		});

		// Add the changes to the task history
		const cancellingComment = `Task cancelled by ${editor.firstName} ${editor.lastName}${data.cancelComment ? `: ${data.cancelComment}` : "."}`;
		const newChange = await recordTaskHistory(cancelledTask, editor, [cancellingComment]);

		// Update the user stats
		await updateUserStats(actor.user.id, "cancel", cancelledTask);

		// Email the user the task is assigned to and the manager
		emailStatus = await sendEmail({
			recipients: cancelledTask.assignedToUser ? cancelledTask.assignedToUser.email : "",
			cc: cancelledTask.assignedToUser?.manager?.email,
			emailType: "taskCancelled",
			userFirstName: editor.firstName,
			userLastName: editor.lastName,
			comment: data.cancelComment,
			task: cancelledTask,
		});

		// If email wasn't sent
		if (!emailStatus || emailStatus.queued === false) logger(`Task ${data.taskId} cancelled, but user not assigned, no email sent`);
		else logger("Task cancelled, email sent");
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
