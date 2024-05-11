import { Task } from "@prisma/client";
import { Creator, UpdateTask } from "./new/submitTask";
import { formatDate } from "@/lib/utilityFunctions";
import prisma from "@/prisma/client";

export default async function compareTasks(oldTask: Task, newTask: Task, editingUser: Creator) {
	const changes: string[] = [];

	const editingUserFullName = `${editingUser.firstName} ${editingUser.lastName}`;

	// Get the assignedToUser object by the ID
	const assignedToUserOld = await prisma.user.findUnique({
		where: { id: oldTask.assignedToUserId! },
		select: { firstName: true, lastName: true },
	});
	const assignedToUserNew = await prisma.user.findUnique({
		where: { id: newTask.assignedToUserId! },
		select: { firstName: true, lastName: true },
	});

	if (oldTask.title !== newTask.title) {
		changes.push(`Title changed from "${oldTask.title}" to "${newTask.title}" by ${editingUserFullName}`);
	}

	if (oldTask.description !== newTask.description) {
		changes.push(`Description changed from "${oldTask.description}" to "${newTask.description}" by ${editingUserFullName}`);
	}

	if (String(oldTask.dueDate) !== String(newTask.dueDate)) {
		changes.push(`Due date changed from ${formatDate(new Date(oldTask.dueDate))} to ${formatDate(new Date(newTask.dueDate))} by ${editingUserFullName}`);
	}

	if (oldTask.assignedToUserId !== newTask.assignedToUserId) {
		changes.push(
			`Assigned to changed from ${assignedToUserOld?.firstName} ${assignedToUserOld?.lastName} to ${assignedToUserNew?.firstName} ${assignedToUserNew?.lastName} by ${editingUserFullName}`
		);
	}

	return changes;
}
