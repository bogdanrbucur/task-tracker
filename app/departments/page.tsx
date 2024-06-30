import { Card } from "@/components/ui/card";
import prisma from "@/prisma/client";
import { notFound } from "next/navigation";
import { getAuth } from "../_auth/actions/get-auth";
import { getPermissions } from "../_auth/actions/get-permissions";
import DepartmentsTable, { DepartmentExpanded, DepartmentsQuery, columnNames } from "./DeptTable";
import DepartmentsTopSection from "./DeptTopSection";

export const revalidate = 5;

interface Props {
	searchParams: DepartmentsQuery;
}

export default async function DepartmentsPage({ searchParams }: Props) {
	// Check user permissions
	const { user } = await getAuth();
	const userPermissions = await getPermissions(user?.id);

	// Only admins can see all users
	if (!userPermissions?.isAdmin) return notFound();

	const sortOrder = searchParams.sortOrder;
	const orderBy = searchParams.orderBy && columnNames.map((column) => column).includes(searchParams.orderBy) ? { [searchParams.orderBy]: sortOrder } : undefined;
	const page = searchParams.page ? parseInt(searchParams.page) : 1;
	const pageSize = 12;
	const departments = (await prisma.department.findMany({
		orderBy,
		skip: (page - 1) * pageSize,
		take: pageSize,
		select: { id: true, name: true, users: { select: { id: true } } },
	})) as DepartmentExpanded[];
	const departmentsCount = await prisma.department.count();

	return (
		<Card className="container mx-auto px-0 md:px-0 max-w-2xl">
			<div className="fade-in container mx-auto py-1">
				<DepartmentsTopSection />
				<DepartmentsTable searchParams={searchParams} departments={departments} />
			</div>
		</Card>
	);
}
