"use server";

import { getAuth } from "@/actions/auth/get-auth";
import { EmailResponse, sendEmail } from "@/app/email/email";
import getUserDetails from "@/app/users/_actions/getUserById";
import { logger } from "@/lib/utilityFunctions";
import prisma from "@/prisma/client";
import { redirect } from "next/navigation";
import { z } from "zod";
import updateUserStats from "../../_actions/updateUserStats";
import { recordTaskHistory } from "./recordTaskHistory";

export default async function completeTask(prevState: any, formData: FormData) {
	// const rawData = Object.fromEntries(f.entries());
	// console.log(rawData);

	// Check user permissions
	const { user: agent } = await getAuth();
	if (!agent) return { message: "You do not have permission to perform this action." };

	// Define the Zod schema for the form data
	const schema = z.object({
		taskId: z.string(),
		completeComment: z.string().min(4, { message: "Comment must be at least 4 characters." }).max(1000, { message: "Comment must be at most 1000 characters." }),
		userId: z.string().length(25, { message: "User is required." }),
	});

	let emailStatus: EmailResponse | undefined;
	try {
		// Parse the form data using the schema
		// If validation fails, an error will be thrown and caught in the catch block
		const data = schema.parse({
			taskId: formData.get("taskId") as string,
			completeComment: formData.get("completeComment") as string,
			userId: formData.get("userId") as string,
		});

		// Get the user the task is assigned to and check that the userId is the user the task is assigned to
		const task = await prisma.task.findUnique({
			where: { id: Number(data.taskId) },
			include: { assignedToUser: { select: { firstName: true, lastName: true, id: true } } },
		});

		// Get the details of the user who is reopening the task
		const editor = await getUserDetails(data.userId);
		if (task?.assignedToUser?.id !== data.userId && !editor.isAdmin) {
			return { message: "You are not authorized to complete this task." };
		}

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
		await updateUserStats(data.userId, "complete", completedTask);

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
			emailStatus?.id ? `&emailId=${emailStatus.id}` : null
		}`
	);
}
