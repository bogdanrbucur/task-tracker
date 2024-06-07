import prisma from "@/prisma/client";
import { notFound } from "next/navigation";
import { getAuth } from "../_auth/actions/get-auth";
import { getPermissions } from "../_auth/actions/get-permissions";
import UserTable, { UsersQuery, columnNames } from "./UserTable";
import { Card } from "@/components/ui/card";
import { UserExtended, prismaExtendedUserSelection } from "./getUserById";
import UsersTopSection from "./UsersTopSection";

interface Props {
	searchParams: UsersQuery;
}

export default async function UsersPage({ searchParams }: Props) {
	// Check user permissions
	const { user } = await getAuth();
	const userPermissions = await getPermissions(user?.id);

	// Only admins can see all users
	if (!userPermissions?.isAdmin) return notFound();

	const active = searchParams.active === "false" ? false : searchParams.active === "true" ? true : undefined;
	const sortOrder = searchParams.sortOrder;
	const where = { active };
	const orderBy = searchParams.orderBy && columnNames.map((column) => column).includes(searchParams.orderBy) ? { [searchParams.orderBy]: sortOrder } : undefined;
	const page = searchParams.page ? parseInt(searchParams.page) : 1;
	const pageSize = 10;

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
			<div className="container mx-auto py-1">
				<UsersTopSection />
				<UserTable searchParams={searchParams} users={users as UserExtended[]} />
			</div>
		</Card>
	);
}
