import { sendEmail } from "@/app/email/email";
import logger from "@/lib/logging";
import { checkIfTaskOverdue } from "@/lib/utilityFunctions";
import prisma from "@/prisma/client";
import { syncChecklistItems } from "../../_actions/checklistShared";
import reconcileDescriptionImages from "../../_actions/reconcileDescriptionImages";
import compareTasks from "../../new/_actions/compareTasks";
import { Editor, UpdateTask } from "../../new/_actions/submitTask";
import { recordTaskHistory } from "./recordTaskHistory";

export async function updateTask(task: UpdateTask, editingUser: Editor, attDescriptions: string[]) {
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
			parentId: task.parentId,
		},
		include: { assignedToUser: { select: { email: true, firstName: true, manager: { select: { email: true, firstName: true, lastName: true } } } } },
	});

	if (!updatedTask) throw new Error("Task update failed");

	// Diffed by id, not replaced wholesale - an item's ticked state (who completed it, when) must
	// survive an edit that only touches the title or due date. Returns one collapsed history line
	// rather than one row per item.
	const checklistChange = await syncChecklistItems(updatedTask.id, task.checklistItems);

	// Record history right after the task write succeeds, before the best-effort side effects
	// below (image reconciliation, emails, overdue check, attachment renames) - a failure in any
	// of those would otherwise abort the request and silently drop the history entry even though
	// the task itself was already saved.
	const changes = await compareTasks(oldTask!, updatedTask, editingUser);
	if (checklistChange) changes.push(checklistChange);
	await recordTaskHistory(updatedTask, editingUser, changes);

	// Claim newly embedded images and drop any the description no longer references
	await reconcileDescriptionImages(updatedTask.id, updatedTask.description);

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

	// If attachment descriptions were changed, update them
	let oldAttachments = await prisma.attachment.findMany({
		where: { taskId: updatedTask.id },
	});

	// Keep only source attachments - only these can be renamed
	oldAttachments = oldAttachments.filter((att) => att.type === "source");

	for (const att of oldAttachments) {
		const newDesc = attDescriptions[oldAttachments.indexOf(att)];
		if (att.description !== newDesc && newDesc !== "") {
			await prisma.attachment.update({
				where: { id: att.id },
				data: { description: newDesc },
			});

			logger(`Description updated from ${att.description} to ${newDesc}`);
		}
	}

	logger(`Task ${task.id} updated successfully`);

	return { updatedTask, emailStatus };
}
