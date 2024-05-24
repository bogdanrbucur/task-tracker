// src/app/sign-up/page.tsx

import { getAuth } from "@/app/_auth/actions/get-auth";
import { getPermissions } from "@/app/_auth/actions/get-permissions";
import UserForm from "@/app/users/[id]/UserForm";
import { notFound } from "next/navigation";
import getUsers from "../getUsers";
import prisma from "@/prisma/client";

const SignUpPage = async () => {
	// Check user permissions
	const { user } = await getAuth();
	const userPermissions = await getPermissions(user?.id);

	// Only admins can create users
	if (!userPermissions?.isAdmin) return notFound();

	const users = await getUsers();
	const departments = await prisma.department.findMany();

	return <UserForm users={users} departments={departments} />;
};

export default SignUpPage;
