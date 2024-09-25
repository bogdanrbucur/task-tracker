import { sendEmail } from "@/app/email/email";
import { checkIfTaskOverdue, logDate } from "@/lib/utilityFunctions";
import prisma from "@/prisma/client";
import log from "log-to-file";
import { recordTaskHistory } from "../../[id]/_actions/recordTaskHistory";
import saveAttachment from "../../[id]/_actions/saveAttachment";
import { Editor, NewTask } from "./submitTask";

// Create a new task in the database
export async function createTask(task: NewTask, editingUser: Editor, attFiles: File[], attDescriptions: string[]) {
	const newTask = await prisma.task.create({
		data: {
			title: task.title,
			description: task.description,
			dueDate: task.dueDate,
			assignedToUserId: task.assignedToUserId,
			createdByUserId: task.createdByUserId,
			source: task.source,
			sourceLink: task.sourceLink,
		},
		include: { assignedToUser: { select: { email: true, firstName: true, manager: { select: { email: true, firstName: true, lastName: true } } } } },
	});

	if (!newTask) throw new Error("Task creation failed");

	// Check if the task is overdue
	await checkIfTaskOverdue(newTask.id);

	// Check if an attachment was added and if so, save it
	// Check if a source attachment was added and if so, save it
	if (task.sourceAttachments && task.sourceAttachments.length > 0 && task.sourceAttachments[0].size > 0) {
		console.log("attachments:", attFiles);
		console.log("Attachments found, saving...");

		for (const att of attFiles) {
			await saveAttachment(att, newTask, attDescriptions[attFiles.indexOf(att)]);
			console.log(att.name, attDescriptions[attFiles.indexOf(att)]);
		}
	}

	console.log(`Task ${newTask.id} assigned to ${newTask.assignedToUser?.email} created by ${newTask.createdByUserId} successfully`);
	log(`Task ${newTask.id} assigned to ${newTask.assignedToUser?.email} created by ${newTask.createdByUserId} successfully`, `./logs/${logDate()}`);

	// Send email notification to the assigned user
	const emailStatus = await sendEmail({
		recipients: newTask.assignedToUser ? newTask.assignedToUser.email : "",
		cc: newTask.assignedToUser && newTask.assignedToUser.manager ? newTask.assignedToUser.manager.email : "",
		emailType: "taskAssigned",
		task: newTask,
	});

	// Record the task creation in the task history
	const newChange = await recordTaskHistory(newTask, editingUser);
	return { newTask, emailStatus };
}
