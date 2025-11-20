import { getAuth } from "@/actions/auth/get-auth";
import getUserDetails, { UserExtended, prismaRestrictedUserSelection } from "@/app/users/_actions/getUserById";
import Pagination from "@/components/Pagination";
import { Card } from "@/components/ui/card";
import prisma from "@/prisma/client";
import { Department, Prisma, Status, Task, User } from "@prisma/client";
import { notFound } from "next/navigation";
import { setExportQuery } from "./_actions/getTasksForExport";
import TaskTable, { columnNames } from "./_components/TaskTable";
import TaskTopSection from "./_components/TaskTopSection";

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

export default async function TasksPage({ searchParams }: { searchParams: TasksQuery }) {
	// Check user permissions
	const { user } = await getAuth();
	if (!user) return notFound();

	// Await the full searchParams object - Next.js 15+ change
	const rawSearchParams = await searchParams;

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
	const statuses = rawSearchParams.status ? rawSearchParams.status.split(",").map((statusId) => parseInt(statusId)) : undefined;
	const taskUser = rawSearchParams.user ? rawSearchParams.user : undefined;
	const department = rawSearchParams.dept ? rawSearchParams.dept : undefined;
	const sortOrder = rawSearchParams.sortOrder;
	let searchTermsQuery = rawSearchParams.search ? rawSearchParams.search : undefined;
	let searchTerms: string[] | undefined | string = undefined;
	// If there are search terms, remove any leading/trailing whitespace and split the terms into an array
	if (searchTermsQuery) {
		searchTermsQuery = searchTermsQuery.trim();
		searchTerms = searchTermsQuery.split(" ");
	}

	console.time(`Tasks search: ${searchTermsQuery ? searchTermsQuery : "no search terms"}`);

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
					// * This whole exercise is because the id field is a number, and the rest are strings.
					// * So we can't just search all fields together, we need to create separate filters for id and the rest.
					// * Then combine them with OR, and finally combine all terms with AND.
					// * This way, if the term is a number, it will search by id as well as the other fields.
					// * Normally, we'd just have an OR filter with all fields, but Prisma doesn't allow mixing types in a single filter.
					AND: searchTerms.map((term) => {
						const orFilters: Prisma.TaskWhereInput[] = [
							{ title: { contains: term } },
							{ source: { contains: term } },
							{ description: { contains: term } },
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
							{ status: { displayName: { contains: term } } },
						];
						// If the term is a number, also search by task ID
						if (!isNaN(Number(term))) orFilters.unshift({ id: Number(term) }); // add id filter at the start
						return { OR: orFilters };
					}),
				},
			].filter(Boolean) as Prisma.TaskWhereInput[],
		};
	}
	const orderBy = rawSearchParams.orderBy && columnNames.map((column) => column).includes(rawSearchParams.orderBy) ? { [rawSearchParams.orderBy]: sortOrder } : undefined;
	const page = rawSearchParams.page ? parseInt(rawSearchParams.page) : 1;
	const pageSize = 10;

	let tasks = await prisma.task.findMany({
		where,
		orderBy,
		skip: (page - 1) * pageSize,
		take: pageSize,
		include: {
			status: true,
			// createdByUser: true,
			assignedToUser: {
				// select: prismaExtendedUserSelection,
				select: prismaRestrictedUserSelection,
			},
		},
	});

	await setExportQuery(where, orderBy);

	const taskCount = await prisma.task.count({ where });

	console.timeEnd(`Tasks search: ${searchTermsQuery ? searchTermsQuery : "no search terms"}`);

	const query: TasksQuery = {
		status: rawSearchParams.status,
		orderBy: rawSearchParams.orderBy,
		sortOrder: rawSearchParams.sortOrder,
		page: rawSearchParams.page,
		user: rawSearchParams.user,
		search: rawSearchParams.search,
		dept: rawSearchParams.dept,
	};

	return (
		<Card className="container mx-auto px-0 md:px-0">
			<div className="fade-in container p-2 md:px-7">
				<TaskTopSection />
				<TaskTable tasks={tasks as TaskExtended[]} searchParams={query} viewableUsers={viewableUsers} />
				<Pagination itemCount={taskCount} pageSize={pageSize} currentPage={page} />
			</div>
		</Card>
	);
}
