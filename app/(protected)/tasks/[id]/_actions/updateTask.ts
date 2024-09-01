import prisma from "@/prisma/client";
import compareTasks from "../../new/_actions/compareTasks";
import { Editor, UpdateTask } from "../../new/_actions/submitTask";
import { recordTaskHistory } from "./recordTaskHistory";
import { checkIfTaskOverdue } from "@/lib/utilityFunctions";
import { sendEmail } from "@/app/email/email";
import { randomUUID } from "crypto";

export async function updateTask(task: UpdateTask, editingUser: Editor) {
	// Get the old task for comparison
	const oldTask = await prisma.task.findUnique({
		where: { id: Number(task.id) },
	});

	// Update the task in the database
	const updatedTask = await prisma.task.update({
		where: { id: Number(task.id) },
		data: {
			title: task.title,
			description: task.description,
			dueDate: new Date(task.dueDate),
			assignedToUserId: task.assignedToUserId,
			source: task.source,
			sourceLink: task.sourceLink,
		},
		include: { assignedToUser: { select: { email: true, firstName: true, manager: { select: { email: true, firstName: true, lastName: true } } } } },
	});

	if (!updatedTask) throw new Error("Task update failed");

	// Determine if the user was changed and if so, send an email to the new user
	const oldUserId = oldTask?.assignedToUserId;
	const newUserId = updatedTask.assignedToUserId;
	let emailStatus;
	if (oldUserId !== newUserId) {
		// send email notification to assignee and their manager
		emailStatus = await sendEmail({
			recipients: updatedTask.assignedToUser ? updatedTask.assignedToUser.email : "",
			emailType: "taskAssigned",
			task: updatedTask,
		});
	}

	// Check if the task is now overdue and update its status
	await checkIfTaskOverdue(updatedTask.id);

	// TODO Check if an attachment was added and if so, save it
	if (task.sourceAttachment) {
		console.log("Attachment found, saving...");
		const addedAttachment = await prisma.attachment.create({
			data: {
				id: randomUUID(),
				taskId: updatedTask.id,
				type: "source",
				path: task.sourceAttachment.name,
			},
		});

		if (!addedAttachment) throw new Error("Attachment failed to save");
		console.log(`Attachment ${addedAttachment.id} saved successfully`);
	}

	console.log(`Task ${task.id} updated successfully`);

	// Determine what was changed
	const changes = await compareTasks(oldTask!, updatedTask, editingUser);

	// Add the changes to the task history
	const newChange = await recordTaskHistory(updatedTask, editingUser, changes);
	return { updatedTask, emailStatus };
}
