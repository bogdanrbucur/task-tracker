import { TaskExtended } from "./(protected)/tasks/page";

export interface DeptTaskChartData {
	name: string;
	inprogress: number;
	completed: number;
	overdue: number;
	value: number;
	url: string;
}

export default function departmentTasks(tasks: TaskExtended[]) {
	// assign the department to each task
	tasks.map((task) => {
		task.department = task.assignedToUser?.department || undefined;
	});

	const deptTasks: DeptTaskChartData[] = [];
	tasks.forEach((task) => {
		if (task.department === undefined) return;
		if (!deptTasks.some((s) => s.name === task.department!.name)) {
			deptTasks.push({
				name: task.department.name,
				inprogress: task.statusId === 1 ? 1 : 0,
				overdue: task.statusId === 5 ? 1 : 0,
				completed: task.statusId === 2 ? 1 : 0,
				value: 1,
				url: `/tasks?status=1%2C5%2C2&dept=${task.department.id}`,
			});
		} else {
			deptTasks.find((s) => s.name === task.department!.name)!.value++;
			if (task.statusId === 1) deptTasks.find((s) => s.name === task.department!.name)!.inprogress++;
			if (task.statusId === 2) deptTasks.find((s) => s.name === task.department!.name)!.completed++;
			if (task.statusId === 5) deptTasks.find((s) => s.name === task.department!.name)!.overdue++;
		}
	});

	return deptTasks;
}
