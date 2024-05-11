import prisma from "@/prisma/client";
import { Editor, NewTask } from "./new/submitTask";
import { recordTaskHistory } from "./recordTaskHistory";

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
	});

	if (!newTask) throw new Error("Task creation failed");

	console.log(`Task ${newTask.id} created successfully`);

	// Record the task creation in the task history
	const newChange = await recordTaskHistory(newTask, editingUser);
	return newTask;
}
