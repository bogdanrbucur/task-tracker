import { getAuth } from "@/actions/auth/get-auth";
import getUserDetails, { UserExtended, prismaExtendedUserSelection } from "@/app/users/_actions/getUserById";
import Pagination from "@/components/Pagination";
import { Card } from "@/components/ui/card";
import prisma from "@/prisma/client";
import { Department, Prisma, Status, Task, User } from "@prisma/client";
import { notFound } from "next/navigation";
import TaskTable, { columnNames } from "./_components/TaskTable";
import TaskTopSection from "./_components/TaskTopSection";
import { setExportQuery } from "./_actions/getTasksForExport";

export interface TaskExtended extends Task {
	assignedToUser?: UserExtended;
	createdByUser?: User;
	status: Status;
	department?: Department;
}

type StatusTypes = "1" | "2" | "3" | "4" | "5" | undefined;

export interface TasksQuery {
	status: StatusTypes;
	orderBy: keyof Task;
	sortOrder: "asc" | "desc";
	page: string;
	user: string;
	search: string;
	dept: string;
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
	const department = searchParams.dept ? searchParams.dept : undefined;
	const sortOrder = searchParams.sortOrder;
	let searchTermsQuery = searchParams.search ? searchParams.search : undefined;
	let searchTerms: string[] | undefined | string = undefined;
	// If there are search terms, remove any leading/trailing whitespace and split the terms into an array
	if (searchTermsQuery) {
		searchTermsQuery = searchTermsQuery.trim();
		searchTerms = searchTermsQuery.split(" ");
	}

	let where: Prisma.TaskWhereInput | undefined = undefined;
	// If there's no search terminology, just filter by status and user
	if ((statuses || taskUser || department) && !searchTerms) {
		where = {
			AND: [
				statuses ? { statusId: { in: statuses } } : undefined,
				taskUser ? { assignedToUserId: taskUser } : undefined,
				department ? { assignedToUser: { department: { id: Number(department) } } } : undefined,
			].filter(Boolean) as Prisma.TaskWhereInput[],
		};
		// If there's a search term, search in title, description, assignedToUser, and status
	} else if (searchTerms) {
		where = {
			AND: [
				{
					// for each search term, search in title, description, assignedToUser, and status
					AND: searchTerms.map((term) => ({
						OR: [
							{ title: { contains: term } },
							{ description: { contains: term } },
							{ source: { contains: term } },
							{
								assignedToUser: {
									OR: [
										{ firstName: { contains: term } },
										{ lastName: { contains: term } },
										{ department: { OR: [{ name: { contains: term } }] } },
										{ position: { contains: term } },
									],
								},
							},
							{ status: { name: { contains: term } } },
						],
					})),
				},
			].filter(Boolean) as Prisma.TaskWhereInput[],
		};
	}
	const orderBy = searchParams.orderBy && columnNames.map((column) => column).includes(searchParams.orderBy) ? { [searchParams.orderBy]: sortOrder } : undefined;
	const page = searchParams.page ? parseInt(searchParams.page) : 1;
	const pageSize = 12;

	let tasks = await prisma.task.findMany({
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

	await setExportQuery(where, orderBy);

	const taskCount = await prisma.task.count({ where });

	return (
		<Card className="container mx-auto px-0 md:px-0">
			<div className="fade-in container p-2 md:px-7">
				<TaskTopSection />
				<TaskTable tasks={tasks as TaskExtended[]} searchParams={searchParams} viewableUsers={viewableUsers} />
				<Pagination itemCount={taskCount} pageSize={pageSize} currentPage={page} />
			</div>
		</Card>
	);
}
