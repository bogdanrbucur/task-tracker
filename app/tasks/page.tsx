import prisma from "@/prisma/client";
import { Task } from "@prisma/client";
import { columns } from "./columns";
import { DataTable } from "./data-table";

export interface TaskExtended extends Task {
	assignedTo?: string;
	status: string;
	creator?: string;
}

export default async function TasksPage() {
	const tasks = await prisma.task.findMany();

	const users = await prisma.user.findMany();
	const statuses = await prisma.status.findMany();

	// Make a new array tasksExtended and replace the userId and statusId with the actual user and status objects
	const tasksExtended = tasks.map((task) => {
		const assignedTo = users.find((user) => user.id === task.assignedToUserId);
		const status = statuses.find((status) => status.id === task.statusId);
		const creator = users.find((user) => user.id === task.createdByUserId);

		return {
			...task,
			assignedTo: assignedTo?.name,
			status: status?.name,
			creator: creator?.name,
		} as TaskExtended;
	});

	return (
		<div className="container mx-auto py-2">
			<DataTable columns={columns} data={tasksExtended} />
		</div>
	);
}
