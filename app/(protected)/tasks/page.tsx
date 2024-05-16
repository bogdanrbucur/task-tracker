import Pagination from "@/components/Pagination";
import prisma from "@/prisma/client";
import { Status, Task, User } from "@prisma/client";
import TaskTable, { TasksQuery, columnNames } from "./TaskTable";
import TaskTopSection from "./TaskTopSection";
import { Card } from "@/components/ui/card";

export interface TaskExtended extends Task {
	assignedToUser?: User;
	createdByUser?: User;
	status: Status;
}

const statuses = ["1", "2", "3"];

interface Props {
	searchParams: TasksQuery;
}

export default async function TasksPage({ searchParams }: Props) {
	// check if searchParams.status is one of the accepted statuses
	// if not, set it to undefined
	const status = searchParams.status && statuses.includes(searchParams.status) ? parseInt(searchParams.status) : undefined;
	const sortOrder = searchParams.sortOrder;
	const where = { statusId: status };
	const orderBy = searchParams.orderBy && columnNames.map((column) => column).includes(searchParams.orderBy) ? { [searchParams.orderBy]: sortOrder } : undefined;
	const page = searchParams.page ? parseInt(searchParams.page) : 1;
	const pageSize = 18;

	const tasks = (await prisma.task.findMany({
		where,
		orderBy,
		skip: (page - 1) * pageSize,
		take: pageSize,
		include: { status: true, createdByUser: true, assignedToUser: true },
	})) as TaskExtended[];

	const taskCount = await prisma.task.count({ where });

	// Get all users and statuses from the database with all properties except hashedPassword
	const users = await prisma.user.findMany({ select: { id: true, firstName: true, lastName: true } });
	const dbStatuses = await prisma.status.findMany();

	// Make a new array tasksExtended and replace the userId and statusId with the actual user and status objects

	// TODO need to fix this shit and grab everything from the ORM
	// const tasksExtended = tasks.map((task) => {
	// 	const assignedTo = users.find((user) => user.id === task.assignedToUserId);
	// 	const status = dbStatuses.find((status) => status.id === task.statusId);
	// 	const creator = users.find((user) => user.id === task.createdByUserId);

	// 	return {
	// 		...task,
	// 		assignedTo: assignedTo?.firstName ? assignedTo?.firstName : null + " " + assignedTo?.lastName ? assignedTo?.lastName : null,
	// 		status,
	// 		creator: creator?.firstName ? creator?.firstName : null + " " + creator?.lastName ? creator?.lastName : null,
	// 	} as TaskExtended;
	// });

	return (
		<Card className="container mx-auto px-0 md:px-0">
			<div className="container py-1">
				<TaskTopSection />
				<TaskTable tasks={tasks} searchParams={searchParams} />
				<Pagination itemCount={taskCount} pageSize={pageSize} currentPage={page} />
			</div>
		</Card>
	);
}
