// server function to add new comment
"use server";
import { getAuth } from "@/actions/auth/get-auth";
import { EmailResponse, sendEmail } from "@/app/email/email";
import { logDate } from "@/lib/utilityFunctions";
import prisma from "@/prisma/client";
import log from "log-to-file";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export default async function addComment(prevState: any, formData: FormData) {
	// Check user permissions
	const { user: agent } = await getAuth();
	if (!agent) return { message: "You do not have permission to perform this action." };

	// Define the Zod schema for the form data
	const schema = z.object({
		taskId: z.string(),
		userId: z.string().length(25, { message: "User not provided." }),
		comment: z.string().min(2, { message: "Comment must be at least 2 characters." }),
		mentionedUsers: z.array(z.string()).optional(),
	});

	let success;
	try {
		// Parse the form data using the schema
		// If validation fails, an error will be thrown and caught in the catch block
		const data = schema.parse({
			taskId: formData.get("taskId") as string,
			userId: formData.get("userId") as string,
			comment: formData.get("comment") as string,
			mentionedUsers: formData.getAll("mentionedUsers").filter((e) => e !== "") as string[],
		});

		// Rebuild the array of mentioned user IDs
		const mentionedUsersArray = data.mentionedUsers?.flatMap((e) => e.split(","));

		const newComment = await prisma.comment.create({
			data: {
				taskId: Number(data.taskId),
				userId: data.userId,
				time: new Date(),
				comment: data.comment,
			},
		});

		if (newComment) success = true;

		// Get the user who commented
		const user = await prisma.user.findUnique({
			where: { id: data.userId },
		});

		console.log(`New comment on task ${newComment.taskId} by ${user?.email}: ${newComment.comment}`);
		log(`New comment on task ${newComment.taskId} by ${user?.email}: ${newComment.comment}`, `${process.env.LOGS_PATH}/${logDate()}`);

		// If there are users mentioned in the comment
		if (mentionedUsersArray && mentionedUsersArray.length > 0) {
			// Fetch the task
			const task = await prisma.task.findUnique({
				where: { id: Number(data.taskId) },
				include: { assignedToUser: { select: { email: true, firstName: true, manager: { select: { email: true, firstName: true, lastName: true } } } } },
			});

			// Get the users mentioned in the comment
			const mentionedUsersExtended = await prisma.user.findMany({
				where: { id: { in: mentionedUsersArray! } },
			});

			// Build the array of email addresses
			const recipients = mentionedUsersExtended.map((user) => user.email);
			const recipient = mentionedUsersExtended.find((user) => user.firstName);

			// Email the users mentioned in the comment
			const emailStatus: EmailResponse = await sendEmail({
				recipients,
				cc: "",
				userFirstName: user!.firstName,
				userLastName: user!.lastName,
				emailType: "commentMention",
				task: task!,
				comment: data.comment,
				recipientFirstName: recipient?.firstName,
			});

			// If the email queueing failed
			if (!emailStatus.queued) {
				revalidatePath(`/tasks/${formData.get("taskId")}`);
				console.log("User was mentioned in comment, but email failed.");
				log("User was mentioned in comment, but email failed.", `${process.env.LOGS_PATH}/${logDate()}`);
				return { queued: emailStatus.queued, emailId: emailStatus.id };
				// Else it succeded
			} else {
				console.log("User was mentioned in comment, email queued.");
				log("User was mentioned in comment, email queued.", `${process.env.LOGS_PATH}/${logDate()}`);
				revalidatePath(`/tasks/${formData.get("taskId")}`);
				return { queued: emailStatus.queued, emailId: emailStatus.id };
			}
		}
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
	revalidatePath(`/tasks/${formData.get("taskId")}`);
}
