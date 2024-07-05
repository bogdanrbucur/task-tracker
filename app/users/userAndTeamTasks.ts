import prisma from "@/prisma/client";
import { TaskExtended } from "../(protected)/tasks/page";
import { UserExtended } from "./getUserById";

export async function userTasks(userDetails: UserExtended) {
	// Get the status for each task
	const statuses = await prisma.status.findMany();
	userDetails.assignedTasks.forEach((task) => {
		Object.assign(task, { status: statuses.find((status) => status.id === task.statusId) });
	});

	// Sort the tasks by due date
	userDetails.assignedTasks.sort((a, b) => {
		if (a.dueDate < b.dueDate) return -1;
		if (a.dueDate > b.dueDate) return 1;
		return 0;
	});

	// Filter out the tasks with statusId 3 (closed) or 4 (cancelled)
	userDetails.assignedTasks = userDetails.assignedTasks.filter((task) => task.statusId !== 3 && task.statusId !== 4);
	return userDetails.assignedTasks;
}

export function getTeamTasks(userDetails: UserExtended, allTasks: TaskExtended[]) {
	let teamTasks;

	const activeSubordinates = userDetails.subordinates.filter((subordinate) => subordinate.active);
	// If the user has active subordinates, get the tasks assigned to them
	if (activeSubordinates.length > 0) {
		const subordinatesIds = activeSubordinates.map((subordinate) => subordinate.id);
		teamTasks = allTasks.filter((task) => subordinatesIds.includes(task.assignedToUserId!));
		teamTasks = teamTasks.filter((task) => task.statusId !== 3 && task.statusId !== 4);

		// Sorth the tasks first by Completed (statusId 2) and then by Due Date
		teamTasks.sort((a, b) => {
			if (a.statusId === 2 && b.statusId !== 2) return -1;
			if (a.statusId !== 2 && b.statusId === 2) return 1;
			if (a.dueDate < b.dueDate) return -1;
			if (a.dueDate > b.dueDate) return 1;
			return 0;
		});
	}

	return teamTasks;
}
