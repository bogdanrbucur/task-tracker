import { getAuth } from "@/actions/auth/get-auth";
import getUserDetails, { UserExtended, prismaRestrictedUserSelection } from "@/app/users/_actions/getUserById";
import Pagination from "@/components/Pagination";
import { Card } from "@/components/ui/card";
import prisma from "@/prisma/client";
import { Department, Prisma, Status, Task, User } from "@prisma/client";
import { notFound } from "next/navigation";
import { buildTaskOrderBy, buildTaskWhere, type TaskExtended, type TasksQuery } from "./_actions/buildTaskQuery";
import TaskTable, { columnNames } from "./_components/TaskTable";
import TaskTopSection from "./_components/TaskTopSection";

// Both defined alongside the query builder; re-exported here so existing importers are unaffected
export type { TaskExtended, TasksQuery };

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

	// The where/orderBy construction lives in buildTaskQuery so the Excel export runs the exact
	// same query as the page, without a shared module-level global
	const searchTermsQuery = rawSearchParams.search ? rawSearchParams.search.trim() : undefined;

	console.time(`Tasks search: ${searchTermsQuery ? searchTermsQuery : "no search terms"}`);

	const where = buildTaskWhere(rawSearchParams);
	const orderBy = buildTaskOrderBy(rawSearchParams, columnNames);
	const page = rawSearchParams.page ? parseInt(rawSearchParams.page) : 1;
	const pageSize = 10;

	const tasks = await prisma.task.findMany({
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
				<TaskTopSection searchParams={query} />
				<TaskTable tasks={tasks as TaskExtended[]} searchParams={query} viewableUsers={viewableUsers} />
				<Pagination itemCount={taskCount} pageSize={pageSize} currentPage={page} />
			</div>
		</Card>
	);
}
