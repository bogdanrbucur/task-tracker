import getUserDetails from "@/app/users/_actions/getUserById";
import { logger } from "@/lib/utilityFunctions";
import prisma from "@/prisma/client";
import { Task } from "@prisma/client";
import { Editor } from "../../new/_actions/submitTask";

export async function recordTaskHistory(task: Task, editingUser: Editor, changes?: string[]) {
	// Get the assignedToUser object by the ID
	const assignedToUser = await getUserDetails(task.assignedToUserId!);
	const editingUserFullName = `${editingUser.firstName} ${editingUser.lastName}`;

	// Add the changes to the task
	if (changes) {
		for (const change of changes) {
			const newChange = await prisma.change.create({
				data: {
					taskId: task.id,
					userId: editingUser.id,
					time: new Date(),
					changes: change,
				},
			});
			logger(`Task ${newChange.taskId} changed: ${newChange.changes}`);
		}
		return;
	}

	// If there are no changes, the task is new. Record that
	const newChange = await prisma.change.create({
		data: {
			taskId: Number(task.id),
			userId: editingUser.id,
			time: new Date(),
			changes: `Task created by ${editingUserFullName} and assigned to ${assignedToUser?.firstName} ${assignedToUser?.lastName}`,
		},
	});

	logger(`New task ${newChange.taskId}: ${newChange.changes}`);
	return newChange;
}
