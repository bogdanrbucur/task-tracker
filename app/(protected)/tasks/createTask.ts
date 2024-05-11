import prisma from "@/prisma/client";
import { Creator, NewTask } from "./new/submitTask";
import { recordTaskHistory } from "./recordTaskHistory";

// Create a new task in the database
export async function createTask(task: NewTask, editingUser: Creator) {
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

	// Add the changes to the task
	const newChange = await recordTaskHistory(newTask, editingUser);
	console.log(newChange);

	console.log(newTask);
	return newTask;
}
