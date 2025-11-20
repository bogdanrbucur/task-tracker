import { Card } from "@/components/ui/card";
import prisma from "@/prisma/client";
import { Prisma } from "@prisma/client";
import { notFound } from "next/navigation";
import { getAuth } from "../../actions/auth/get-auth";
import { getPermissions } from "../../actions/auth/get-permissions";
import { UserExtended, prismaExtendedUserSelection } from "./_actions/getUserById";
import UserTable, { UsersQuery, columnNames } from "./_components/UserTable";
import UsersTopSection from "./_components/UsersTopSection";
import Pagination from "@/components/Pagination";

interface Props {
	searchParams: UsersQuery;
}

export default async function UsersPage({ searchParams }: Props) {
	// Check user permissions
	const { user } = await getAuth();
	const userPermissions = await getPermissions(user?.id);

	// Await the full searchParams object - Next.js 15+ change
	const rawSearchParams = await searchParams;

	// Only admins can see all users
	if (!userPermissions?.isAdmin) return notFound();

	// Status filtering - hide inactive users by default
	let status = rawSearchParams.status ? rawSearchParams.status : ["active", "unverified"].join(",");
	let statuses: string[] | undefined | string = undefined;
	// If there are statuses selected, remove any leading/trailing whitespace and split the terms into an array
	if (status) {
		status = status.trim();
		statuses = status.split(",");
	}

	// Sort order
	const sortOrder = rawSearchParams.sortOrder;

	// Search terms
	let searchTermsQuery = rawSearchParams.search ? rawSearchParams.search : undefined;
	let searchTerms: string[] | undefined | string = undefined;
	// If there are search terms, remove any leading/trailing whitespace and split the terms into an array
	if (searchTermsQuery) {
		searchTermsQuery = searchTermsQuery.trim();
		searchTerms = searchTermsQuery.split(" ");
	}

	let where: Prisma.UserWhereInput | undefined = undefined;
	// If there's no search terminology, just filter by status and user
	if (status !== undefined && !searchTerms) {
		// If there are statuses selected, filter by them
		where = { status: { in: statuses } };
		// If there's a search term, search in firstName, lastName, department, and position
	} else if (searchTerms) {
		where = {
			AND: [
				{
					// for each search term, search in firstName, lastName, department, and position
					AND: searchTerms.map((term) => ({
						OR: [{ firstName: { contains: term } }, { lastName: { contains: term } }, { department: { name: { contains: term } } }, { position: { contains: term } }],
					})),
				},
			].filter(Boolean) as Prisma.UserWhereInput[],
		};
	}

	let orderBy = rawSearchParams.orderBy && columnNames.map((column) => column).includes(rawSearchParams.orderBy) ? { [rawSearchParams.orderBy]: sortOrder } : undefined;

	// if orderBy === "manager", order by manager's firstName prop
	let newOrderBy: Prisma.UserOrderByWithRelationInput | undefined = undefined;
	if (rawSearchParams.orderBy === "manager") {
		newOrderBy = {
			manager: {
				firstName: sortOrder, // sortOrder is either 'asc' or 'desc'
			},
		};
		orderBy = undefined;
	}
	// if orderBy === "assignedTasks", order by number of open tasks
	if (rawSearchParams.orderBy === "assignedTasks") {
		newOrderBy = {
			assignedTasks: {
				_count: sortOrder,
			},
		};
		orderBy = undefined;
	}
	// if orderBy === "department", order by name of open department
	if (rawSearchParams.orderBy === "department") {
		newOrderBy = {
			department: {
				name: sortOrder,
			},
		};
		orderBy = undefined;
	}

	const page = rawSearchParams.page ? parseInt(rawSearchParams.page) : 1;
	const pageSize = 12;
	const users = await prisma.user.findMany({
		where,
		orderBy: orderBy ? orderBy : newOrderBy,
		skip: (page - 1) * pageSize,
		take: pageSize,
		select: prismaExtendedUserSelection,
	});

	const userCount = await prisma.user.count({ where });

	const plainSearchParams = {
		status: rawSearchParams.status,
		orderBy: rawSearchParams.orderBy,
		sortOrder: rawSearchParams.sortOrder,
		page: rawSearchParams.page,
		search: rawSearchParams.search,
	};

	return (
		<Card className="container mx-auto px-0">
			<div className="fade-in container mx-auto p-2 md:px-7">
				<UsersTopSection />
				<UserTable searchParams={plainSearchParams} users={users as UserExtended[]} />
				<Pagination itemCount={userCount} pageSize={pageSize} currentPage={page} />
			</div>
		</Card>
	);
}
