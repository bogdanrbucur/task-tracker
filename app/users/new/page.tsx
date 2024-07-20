// src/app/sign-up/page.tsx

import { getAuth } from "@/actions/auth/get-auth";
import { getPermissions } from "@/actions/auth/get-permissions";
import UserForm from "@/app/users/[id]/_components/UserForm";
import prisma from "@/prisma/client";
import { notFound } from "next/navigation";
import getUsers from "../_actions/getUsers";

const SignUpPage = async () => {
	// Check user permissions
	const { user } = await getAuth();
	const userPermissions = await getPermissions(user?.id);

	// Only admins can create users
	if (!user || !userPermissions?.isAdmin) return notFound();

	const users = await getUsers();
	const departments = await prisma.department.findMany();

	return <UserForm users={users} departments={departments} editor={user.id} />;
};

export default SignUpPage;
