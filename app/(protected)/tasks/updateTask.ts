import prisma from "@/prisma/client";
import { Creator, UpdateTask } from "./new/submitTask";
import { recordTaskHistory } from "./recordTaskHistory";
import compareTasks from "./compareTasks";

export async function updateTask(task: UpdateTask, editingUser: Creator) {
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
		},
	});

	if (!updatedTask) throw new Error("Task update failed");

	console.log(`Task ${task.id} updated successfully`);

	// Determine what was changed
	const changes = await compareTasks(oldTask!, updatedTask, editingUser);

	// Add the changes to the task
	const newChange = await recordTaskHistory(updatedTask, editingUser, changes);
	return updatedTask;
}
