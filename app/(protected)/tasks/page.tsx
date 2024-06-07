import { getAuth } from "@/app/_auth/actions/get-auth";
import getUserDetails, { UserExtended, prismaExtendedUserSelection } from "@/app/users/getUserById";
import Pagination from "@/components/Pagination";
import { Card } from "@/components/ui/card";
import prisma from "@/prisma/client";
import { Prisma, Status, Task, User } from "@prisma/client";
import { notFound } from "next/navigation";
import TaskTable, { TasksQuery, columnNames } from "./TaskTable";
import TaskTopSection from "./TaskTopSection";

export interface TaskExtended extends Task {
	assignedToUser?: UserExtended;
	createdByUser?: User;
	status: Status;
}

interface Props {
	searchParams: TasksQuery;
}

export default async function TasksPage({ searchParams }: Props) {
	// Check user permissions
	const { user } = await getAuth();
	if (!user) return notFound();

	// Get the users this user can view
	const userDetails = await getUserDetails(user.id);
	let viewableUsers: string[] = [];
	if (userDetails.isAdmin) {
		// Get all users IDs
		viewableUsers = await prisma.user.findMany({ select: { id: true } }).then((users) => users.map((user) => user.id));
	} else {
		// Get the IDs of the user's subordinates and the user's own ID
		viewableUsers = userDetails.subordinates.map((sub) => sub?.id);
		viewableUsers.push(user.id);
	}

	// Split the status string into an array of numbers, as multiple statuses can be selected
	const statuses = searchParams.status ? searchParams.status.split(",").map((statusId) => parseInt(statusId)) : undefined;
	const taskUser = searchParams.user ? searchParams.user : undefined;
	const sortOrder = searchParams.sortOrder;
	let where: Prisma.TaskWhereInput | undefined = undefined;
	if (statuses || taskUser) {
		where = {
			AND: [
				statuses ? { statusId: { in: statuses } } : undefined,
				taskUser ? { assignedToUserId: taskUser } : undefined,
			].filter(Boolean) as Prisma.TaskWhereInput[],
		};
	}
	// const where = { statusId: { in: statuses } };
	const orderBy = searchParams.orderBy && columnNames.map((column) => column).includes(searchParams.orderBy) ? { [searchParams.orderBy]: sortOrder } : undefined;
	const page = searchParams.page ? parseInt(searchParams.page) : 1;
	const pageSize = 12;

	const tasks = await prisma.task.findMany({
		where,
		orderBy,
		skip: (page - 1) * pageSize,
		take: pageSize,
		include: {
			status: true,
			createdByUser: true,
			assignedToUser: {
				select: prismaExtendedUserSelection,
			},
		},
	});

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
