import prisma from "@/prisma/client";
import React from "react";
import TaskForm from "../../taskForm";
import { getAuth } from "@/app/_auth/actions/get-auth";
import { getUserPermissions } from "@/app/_auth/actions/get-permissions";
import { notFound } from "next/navigation";
import getUsers from "@/app/users/getUsers";

const EditIssuePage = async ({ params }: { params: { id: string } }) => {
	// Check user permissions
	const { user } = await getAuth();
	let userPermissions;
	if (user) userPermissions = await getUserPermissions(user.id);
	if (!userPermissions?.canCreateTasks) return notFound();

	const users = await getUsers();

	// Fetch the task with the given ID
	const task = await prisma.task.findUnique({
		where: { id: Number(params.id) },
		include: { assignedToUser: true },
	});

	if (!task) return notFound();

	return (
		<>
			<div>Editing task {params.id}</div>
			<TaskForm user={user!} users={users} task={task} />
		</>
	);
};

export default EditIssuePage;
