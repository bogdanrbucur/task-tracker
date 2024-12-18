import { sendEmail } from "@/app/email/email";
import { checkIfTaskOverdue, logDate } from "@/lib/utilityFunctions";
import prisma from "@/prisma/client";
import log from "log-to-file";
import { recordTaskHistory } from "../../[id]/_actions/recordTaskHistory";
import { Editor, NewTask } from "./submitTask";
import updateUserStats from "../../_actions/updateUserStats";

// Create a new task in the database
export async function createTask(task: NewTask, editingUser: Editor) {
	const newTask = await prisma.task.create({
		data: {
			title: task.title,
			description: task.description,
			dueDate: task.dueDate,
			originalDueDate: task.dueDate,
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

	console.log(`Task ${newTask.id} assigned to ${newTask.assignedToUser?.email} created by ${newTask.createdByUserId} successfully`);
	log(`Task ${newTask.id} assigned to ${newTask.assignedToUser?.email} created by ${newTask.createdByUserId} successfully`, `${process.env.LOGS_PATH}/${logDate()}`);

	// Update editingUser stats
	await updateUserStats(editingUser.id, "create", newTask);

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
