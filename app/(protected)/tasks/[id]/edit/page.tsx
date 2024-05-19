import { getAuth } from "@/app/_auth/actions/get-auth";
import { getPermissions } from "@/app/_auth/actions/get-permissions";
import getUserDetails from "@/app/users/getUserById";
import getUsers from "@/app/users/getUsers";
import prisma from "@/prisma/client";
import { notFound } from "next/navigation";
import TaskForm from "../TaskForm";

const EditIssuePage = async ({ params }: { params: { id: string } }) => {
	// Check user permissions
	const { user } = await getAuth();
	const userPermissions = await getPermissions(user?.id);

	// Fetch the task with the given ID
	const task = await prisma.task.findUnique({
		where: { id: Number(params.id) },
		include: { assignedToUser: true },
	});

	// If the task is not found OR task is not In Progress, return a 404 page, included in Next.js
	if (!task || task.statusId !== 1) return notFound();

	// Check if the user has the permission to edit the task = is admin, is manager of the assigned user, or is the assigned user
	const canEditTask = userPermissions?.isAdmin || task?.assignedToUser?.managerId === user?.id || task?.assignedToUser?.id === user?.id;
	if (!canEditTask) return notFound();

	// Get logged in user details and all users
	const thisUser = await getUserDetails(user?.id!);
	const allUsers = await getUsers();

	// Filter the users to include only the logged in user and their subordinates, unless they are admin, in which case all users are included
	const subordinates = thisUser?.subordinates;
	const filteredUsers = allUsers!.filter((u) => userPermissions.isAdmin || u.id === thisUser?.id || subordinates?.some((s) => s!.id === u.id));

	return <TaskForm user={user!} users={filteredUsers} task={task} />;
};

export default EditIssuePage;
