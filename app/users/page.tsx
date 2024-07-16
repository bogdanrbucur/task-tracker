import { Card } from "@/components/ui/card";
import prisma from "@/prisma/client";
import { Prisma } from "@prisma/client";
import { notFound } from "next/navigation";
import { getAuth } from "../_auth/actions/get-auth";
import { getPermissions } from "../_auth/actions/get-permissions";
import UserTable, { UsersQuery, columnNames } from "./UserTable";
import UsersTopSection from "./UsersTopSection";
import { UserExtended, prismaExtendedUserSelection } from "./getUserById";

interface Props {
	searchParams: UsersQuery;
}

export default async function UsersPage({ searchParams }: Props) {
	// Check user permissions
	const { user } = await getAuth();
	const userPermissions = await getPermissions(user?.id);

	// Only admins can see all users
	if (!userPermissions?.isAdmin) return notFound();

	// Status filtering - hide inactive users by default
	let status = searchParams.status ? searchParams.status : ["active", "unverified"].join(",");
	let statuses: string[] | undefined | string = undefined;
	// If there are statuses selected, remove any leading/trailing whitespace and split the terms into an array
	if (status) {
		status = status.trim();
		statuses = status.split(",");
	}

	// Sort order
	const sortOrder = searchParams.sortOrder;

	// Search terms
	let searchTermsQuery = searchParams.search ? searchParams.search : undefined;
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

	const orderBy = searchParams.orderBy && columnNames.map((column) => column).includes(searchParams.orderBy) ? { [searchParams.orderBy]: sortOrder } : undefined;
	const page = searchParams.page ? parseInt(searchParams.page) : 1;
	const pageSize = 12;
	const users = await prisma.user.findMany({
		where,
		orderBy,
		skip: (page - 1) * pageSize,
		take: pageSize,
		select: prismaExtendedUserSelection,
	});

	const userCount = await prisma.user.count({ where });

	return (
		<Card className="container mx-auto px-0 md:px-0">
			<div className="fade-in container mx-auto py-1">
				<UsersTopSection />
				<UserTable searchParams={searchParams} users={users as UserExtended[]} />
			</div>
		</Card>
	);
}
