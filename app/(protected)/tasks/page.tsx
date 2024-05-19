import { getAuth } from "@/app/_auth/actions/get-auth";
import getUserDetails, { UserExtended, prismaExtendedUserSelection } from "@/app/users/getUserById";
import Pagination from "@/components/Pagination";
import { Card } from "@/components/ui/card";
import prisma from "@/prisma/client";
import { Status, Task, User } from "@prisma/client";
import { notFound } from "next/navigation";
import TaskTable, { TasksQuery, columnNames } from "./TaskTable";
import TaskTopSection from "./TaskTopSection";

export interface TaskExtended extends Task {
	assignedToUser?: UserExtended;
	createdByUser?: User;
	status: Status;
}

const statuses = ["1", "2", "3", "4"];

interface Props {
	searchParams: TasksQuery;
}

export default async function TasksPage({ searchParams }: Props) {
	// Check user permissions
	const { user } = await getAuth();
	if (!user) return notFound();

	// Get the users this user can view
	const userSubordinates = (await getUserDetails(user.id)).subordinates;
	let viewableUsers: string[] = [];
	viewableUsers = userSubordinates.map((sub) => sub?.id);
	viewableUsers.push(user.id);

	// check if searchParams.status is one of the accepted statuses
	// if not, set it to undefined
	const status = searchParams.status && statuses.includes(searchParams.status) ? parseInt(searchParams.status) : undefined;
	const sortOrder = searchParams.sortOrder;
	const where = { statusId: status };
	const orderBy = searchParams.orderBy && columnNames.map((column) => column).includes(searchParams.orderBy) ? { [searchParams.orderBy]: sortOrder } : undefined;
	const page = searchParams.page ? parseInt(searchParams.page) : 1;
	const pageSize = 15;

	const tasks = (await prisma.task.findMany({
		where,
		orderBy,
		skip: (page - 1) * pageSize,
		take: pageSize,
		// TODO is this sending the hashed password to the client?
		include: {
			status: true,
			createdByUser: true,
			assignedToUser: {
				select: prismaExtendedUserSelection,
			},
		},
	}));

	const taskCount = await prisma.task.count({ where });

	return (
		<Card className="container mx-auto px-0 md:px-0">
			<div className="container py-1">
				<TaskTopSection />
				<TaskTable tasks={tasks as TaskExtended[]} searchParams={searchParams} viewableUsers={viewableUsers} />
				<Pagination itemCount={taskCount} pageSize={pageSize} currentPage={page} />
			</div>
		</Card>
	);
}
