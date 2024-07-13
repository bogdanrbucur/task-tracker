import prisma from "@/prisma/client";
import { Editor, NewTask } from "./submitTask";
import { recordTaskHistory } from "../[id]/recordTaskHistory";
import { sendEmail } from "@/app/email/email";
import { checkIfTaskOverdue } from "@/lib/utilityFunctions";

// Create a new task in the database
export async function createTask(task: NewTask, editingUser: Editor) {
	const newTask = await prisma.task.create({
		data: {
			title: task.title,
			description: task.description,
			dueDate: task.dueDate,
			assignedToUserId: task.assignedToUserId,
			createdByUserId: task.createdByUserId,
		},
		include: { assignedToUser: { select: { email: true, firstName: true, manager: { select: { email: true, firstName: true, lastName: true } } } } },
	});

	if (!newTask) throw new Error("Task creation failed");

	// Check if the task is overdue
	await checkIfTaskOverdue(newTask.id);

	console.log(`Task ${newTask.id} created successfully`);

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
