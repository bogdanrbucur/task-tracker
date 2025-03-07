import { getAuth } from "@/actions/auth/get-auth";
import { getPermissions } from "@/actions/auth/get-permissions";
import getUserDetails from "@/app/users/_actions/getUserById";
import getUsers from "@/app/users/_actions/getUsers";
import prisma from "@/prisma/client";
import { notFound } from "next/navigation";
import TaskForm from "../_components/TaskForm";

const EditTaskpage = async ({ params }: { params: { id: string } }) => {
	// Check user permissions
	const { user } = await getAuth();
	const userPermissions = await getPermissions(user?.id);

	// Fetch the task with the given ID
	const task = await prisma.task.findUnique({
		where: { id: Number(params.id) },
		include: { assignedToUser: true, attachments: true },
	});

	// If the task is not found OR task is not In Progress or Overdue, return a 404 page, included in Next.js
	if (!task || (task.statusId !== 1 && task.statusId !== 5)) return notFound();

	// Check if the user has the permission to edit the task = is admin, is manager of the assigned user, or is the assigned user
	const canEditTask = userPermissions?.isAdmin || task?.assignedToUser?.managerId === user?.id || task?.assignedToUser?.id === user?.id;
	if (!canEditTask) return notFound();

	// Get logged in user details and all users
	const thisUser = await getUserDetails(user?.id!);
	const allUsers = await getUsers();

	// Filter the users to include only the logged in user and their subordinates, unless they are admin, in which case all users are included
	const subordinates = thisUser?.subordinates;
	let filteredUsers = allUsers!.filter((u) => userPermissions.isAdmin || u.id === thisUser?.id || subordinates?.some((s) => s!.id === u.id));
	// Filter out inactive users
	filteredUsers = filteredUsers.filter((u) => u.status === "active");

	return <TaskForm user={user!} users={filteredUsers} task={task} />;
};

export default EditTaskpage;
