import { getAuth } from "@/actions/auth/get-auth";
import { getPermissions } from "@/actions/auth/get-permissions";
import getUserDetails from "@/app/users/_actions/getUserById";
import getUsers from "@/app/users/_actions/getUsers";
import prisma from "@/prisma/client";
import { notFound } from "next/navigation";
import UserForm from "../_components/UserForm";

const EditUserPage = async ({ params }: { params: { id: string } }) => {
	// Check user permissions
	const { user } = await getAuth();
	const userPermissions = await getPermissions(user?.id);

	// Fetch the task with the given ID
	const selectedUser = await getUserDetails(params.id);

	// If the user is not found, return a 404 page, included in Next.js
	if (!selectedUser) return notFound();

	// Check if the user has the permission to edit the task = is admin or is the current user
	const canEditUser = userPermissions?.isAdmin || selectedUser.id === user?.id;
	if (!canEditUser) return notFound();

	// Get logged in user details and all users
	let allUsers = await getUsers();
	// Filter out inactive users
	allUsers = allUsers.filter((u) => u.status === "active");
	const departments = await prisma.department.findMany();

	return <UserForm editor={user!.id} user={selectedUser} users={allUsers} departments={departments} />;
};

export default EditUserPage;
