import getUserDetails from "@/app/users/_actions/getUserById";
import { formatDate } from "@/lib/utilityFunctions";
import { Task } from "@prisma/client";
import { Editor } from "./submitTask";

export default async function compareTasks(oldTask: Task, newTask: Task, editingUser: Editor) {
	const changes: string[] = [];

	const editingUserFullName = `${editingUser.firstName} ${editingUser.lastName}`;

	// Get the assignedToUser object by the ID
	const assignedToUserOld = await getUserDetails(oldTask.assignedToUserId!);
	const assignedToUserNew = await getUserDetails(newTask.assignedToUserId!);

	const oldUser = `${assignedToUserOld?.firstName} ${assignedToUserOld?.lastName}`;
	const newUser = `${assignedToUserNew?.firstName} ${assignedToUserNew?.lastName}`;

	if (oldTask.title !== newTask.title) changes.push(`Title changed from "${oldTask.title}" to "${newTask.title}" by ${editingUserFullName}`);

	// Only record that the description changed, not both bodies. Descriptions are markdown and can
	// run to 16k characters, so embedding them here would store ~32k of markup per edit in a field
	// TaskHistory renders as a single flat line.
	if (oldTask.description !== newTask.description) changes.push(`Description changed by ${editingUserFullName}`);

	if (String(oldTask.dueDate) !== String(newTask.dueDate))
		changes.push(`Due date changed from ${formatDate(new Date(oldTask.dueDate))} to ${formatDate(new Date(newTask.dueDate))} by ${editingUserFullName}`);

	if (oldTask.assignedToUserId !== newTask.assignedToUserId) changes.push(`Assigned to changed from ${oldUser} to ${newUser} by ${editingUserFullName}`);

	return changes;
}
