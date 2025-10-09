"use server";

import { getAuth } from "@/actions/auth/get-auth";
import { EmailResponse, sendEmail } from "@/app/email/email";
import getUserDetails from "@/app/users/_actions/getUserById";
import { checkIfTaskOverdue, logger } from "@/lib/utilityFunctions";
import prisma from "@/prisma/client";
import { redirect } from "next/navigation";
import { z } from "zod";
import updateUserStats from "../../_actions/updateUserStats";
import { recordTaskHistory } from "./recordTaskHistory";

export default async function reopenTask(prevState: any, formData: FormData) {
	// const rawData = Object.fromEntries(f.entries());
	// logger(rawData);

	// Check user permissions
	const { user: agent } = await getAuth();
	if (!agent) return { message: "You do not have permission to perform this action." };

	// Define the Zod schema for the form data
	const schema = z.object({
		taskId: z.string(),
		reopenComment: z.string().min(10, { message: "Comment must be at least 10 characters." }).max(200, { message: "Comment must be at most 200 characters." }),
		userId: z.string().length(25, { message: "User is required." }),
	});

	let emailStatus: EmailResponse | undefined;
	try {
		// Parse the form data using the schema
		// If validation fails, an error will be thrown and caught in the catch block
		const data = schema.parse({
			taskId: formData.get("taskId") as string,
			reopenComment: formData.get("reopenComment") as string,
			userId: formData.get("userId") as string,
		});

		// Get the user the task is assigned to and check that the userId is the manager of the user the task is assigned to
		const task = await prisma.task.findUnique({
			where: { id: Number(data.taskId) },
			include: { assignedToUser: { select: { managerId: true, manager: { select: { firstName: true, lastName: true, id: true } } } } },
		});

		// Temporary store the task completion date to compute user stats
		const taskCompletionDate = task?.completedOn;

		// Get the details of the user who is reopening the task
		const editor = await getUserDetails(data.userId);
		if (task?.assignedToUser?.managerId !== editor.id && !editor.isAdmin) return { message: "You are not authorized to reopen this task." };

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
		if (task?.statusId === 2) await updateUserStats(data.userId, "reopen", reopenedTask);

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
			emailStatus?.id ? `&emailId=${emailStatus.id}` : null
		}`
	);
}
