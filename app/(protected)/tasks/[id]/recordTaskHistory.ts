import getUserPropsById from "@/app/users/getUserById";
import prisma from "@/prisma/client";
import { Task } from "@prisma/client";
import { Editor } from "../new/submitTask";

export async function recordTaskHistory(task: Task, editingUser: Editor, changes?: string[]) {
	// Get the assignedToUser object by the ID
	const assignedToUser = await getUserPropsById(task.assignedToUserId!);

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
			console.log("New change recorded:", newChange);
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

	console.log("New change recorded:", newChange);
	return newChange;
}
