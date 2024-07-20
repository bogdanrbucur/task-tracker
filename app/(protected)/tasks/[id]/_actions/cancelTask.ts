"use server";

import { EmailResponse, sendEmail } from "@/app/email/email";
import getUserDetails from "@/app/users/_actions/getUserById";
import prisma from "@/prisma/client";
import { redirect } from "next/navigation";
import { z } from "zod";
import { recordTaskHistory } from "./recordTaskHistory";

export default async function cancelTask(prevState: any, formData: FormData) {
	// const rawData = Object.fromEntries(f.entries());
	// console.log(rawData);

	// Define the Zod schema for the form data
	const schema = z.object({
		taskId: z.string(),
		cancelComment: z.string().min(10, { message: "Comment must be at least 10 characters." }).max(200, { message: "Comment must be at most 200 characters." }),
		userId: z.string().length(25, { message: "User is required." }),
	});

	let emailStatus: EmailResponse | undefined;
	try {
		// Parse the form data using the schema
		// If validation fails, an error will be thrown and caught in the catch block
		const data = schema.parse({
			taskId: formData.get("taskId") as string,
			cancelComment: formData.get("cancelComment") as string,
			userId: formData.get("userId") as string,
		});

		// Get the user the task is assigned to and check that the userId is the manager of the user the task is assigned to
		const task = await prisma.task.findUnique({
			where: { id: Number(data.taskId) },
			include: { assignedToUser: { select: { managerId: true, manager: { select: { firstName: true, lastName: true, id: true } } } } },
		});

		// Get the details of the user who is reopening the task
		const editor = await getUserDetails(data.userId);
		if (task?.assignedToUser?.managerId !== editor.id && !editor.isAdmin) {
			return { message: "You are not authorized to cancel this task." };
		}

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
		if (!emailStatus) console.log("Task cancelled, but user not assigned, no email sent");
		// If the email sent failed
		else if (emailStatus && !emailStatus.success) console.log("Task cancelled, email error");
		else console.log("Task cancelled, email sent");
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
	redirect(`/tasks/${formData.get("taskId")}${emailStatus && !emailStatus.success ? "?toastUser=fail" : emailStatus ? "?toastUser=success" : ""}`);
}
