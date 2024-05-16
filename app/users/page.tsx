import prisma from "@/prisma/client";
import { notFound } from "next/navigation";
import { getAuth } from "../_auth/actions/get-auth";
import { getUserPermissions } from "../_auth/actions/get-permissions";
import UserTable, { UsersQuery, columnNames } from "./UserTable";
import { Card } from "@/components/ui/card";

interface Props {
	searchParams: UsersQuery;
}

const statuses = ["1", "2"];

export default async function UsersPage({ searchParams }: Props) {
	const { user } = await getAuth();

	let userPermissions;
	if (user) userPermissions = await getUserPermissions(user.id);

	if (!userPermissions?.canCreateTasks) return notFound();

	const status = searchParams.status && statuses.includes(searchParams.status) ? parseInt(searchParams.status) : undefined;
	const sortOrder = searchParams.sortOrder;
	const where = { statusId: status };
	const orderBy = searchParams.orderBy && columnNames.map((column) => column).includes(searchParams.orderBy) ? { [searchParams.orderBy]: sortOrder } : undefined;
	const page = searchParams.page ? parseInt(searchParams.page) : 1;
	const pageSize = 10;

	const users = await prisma.user.findMany({
		where,
		orderBy,
		skip: (page - 1) * pageSize,
		take: pageSize,
		select: {
			id: true,
			firstName: true,
			lastName: true,
			position: true,
			email: true,
			department: true,
			manager: { select: { id: true, firstName: true, lastName: true, position: true, department: true, email: true } },
			assignedTasks: true,
		},
	});

	const userCount = await prisma.user.count({ where });

	return (
		<Card className="container mx-auto px-0 md:px-0">
			<div className="container mx-auto py-1">
				<UserTable searchParams={searchParams} users={users} />
			</div>
		</Card>
	);
}
