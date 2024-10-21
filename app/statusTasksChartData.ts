import { TaskExtended } from "./(protected)/tasks/page";

export interface StatusTasksChartData {
	name: string;
	value: number;
	url: string;
	slug: string;
}

export default function statusTasks(tasks: TaskExtended[]) {
	const statuses: StatusTasksChartData[] = [];
	// Iterate through each task
	tasks.forEach((task) => {
		// If the status is not already in the array, add it
		if (!statuses.some((s) => s.name === task.status.displayName))
			statuses.push({ name: task.status.displayName, value: 1, url: `/tasks?status=${task.status.id}`, slug: task.status.displayName.replaceAll(" ", "").toLowerCase() });
		// If the status is already in the array, increment the value
		else statuses.find((s) => s.name === task.status.displayName)!.value++;
	});

	return statuses;
}
