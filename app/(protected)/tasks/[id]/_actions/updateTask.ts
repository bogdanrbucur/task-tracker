import { sendEmail } from "@/app/email/email";
import { checkIfTaskOverdue } from "@/lib/utilityFunctions";
import prisma from "@/prisma/client";
import fs from "fs-extra";
import compareTasks from "../../new/_actions/compareTasks";
import { Editor, UpdateTask } from "../../new/_actions/submitTask";
import { recordTaskHistory } from "./recordTaskHistory";
import saveAttachment from "./saveAttachment";

export async function updateTask(task: UpdateTask, editingUser: Editor, attFiles: File[], attDescriptions: string[]) {
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

	// Check if a source attachment was added and if so, save it
	if (task.sourceAttachments && task.sourceAttachments.length > 0 && task.sourceAttachments[0].size > 0) {
		console.log("attachments:", attFiles);
		console.log("Attachments found, saving...");

		for (const att of attFiles) {
			await saveAttachment(att, updatedTask, attDescriptions[attFiles.indexOf(att)]);
			console.log(att.name, attDescriptions[attFiles.indexOf(att)]);
		}
	}

	// If some source attachments were replaced, remove the old ones
	if (task.sourceAttachments && task.sourceAttachments.length > 0 && task.sourceAttachments[0].size > 0) {
		console.log("Some attachments removed, deleting...");
		const oldAttachments = await prisma.attachment.findMany({
			where: { taskId: updatedTask.id },
		});

		console.log("sent attachments", task.sourceAttachments);
		console.log("existing attachments", oldAttachments);

		const oldAttachmentNames = oldAttachments.map((att) => att.path);
		const newAttachmentNames = task.sourceAttachments.map((att) => att.name);
		const removedAttachments = oldAttachmentNames.filter((att) => !newAttachmentNames.includes(att));
		console.log("Removed attachments:", removedAttachments);
		for (const att of removedAttachments) {
			try {
				await prisma.attachment.deleteMany({
					where: {
						taskId: updatedTask.id,
						path: att,
					},
				});

				await fs.remove(`./attachments/${updatedTask.id}/${att}`);
			} catch (err) {
				console.log(err);
			}
		}
	}

	// If attachment descriptions were changed, update them
	const oldAttachments = await prisma.attachment.findMany({
		where: { taskId: updatedTask.id },
	});
	const oldAttachmentDescriptions = oldAttachments.map((att) => att.description);
	const newAttachmentDescriptions = attDescriptions;
	const changedDescriptions = oldAttachmentDescriptions.filter((desc) => desc !== null && !newAttachmentDescriptions.includes(desc));
	console.log("Changed descriptions:", changedDescriptions);
	for (const desc of changedDescriptions) {
		try {
			await prisma.attachment.updateMany({
				where: {
					taskId: updatedTask.id,
					description: desc,
				},
				data: {
					description: newAttachmentDescriptions[oldAttachmentDescriptions.indexOf(desc)],
				},
			});
		} catch (err) {
			console.log(err);
		}
	}

	console.log(`Task ${task.id} updated successfully`);

	// Determine what was changed
	const changes = await compareTasks(oldTask!, updatedTask, editingUser);

	// Add the changes to the task history
	const newChange = await recordTaskHistory(updatedTask, editingUser, changes);
	return { updatedTask, emailStatus };
}
