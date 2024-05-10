import { getAuth } from "@/app/_auth/actions/get-auth";
import { getUserPermissions } from "@/app/_auth/actions/get-permissions";
import { UsersSelection } from "@/components/UsersSelection";
import { DatePicker } from "@/components/DatePicker";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import prisma from "@/prisma/client";
import { notFound } from "next/navigation";
import React, { useState } from "react";
import submitTask from "./submitTask";
import TaskForm, { SelectionUser } from "../taskForm";



const NewTaskPage = async () => {
	// Check user permissions
	const { user } = await getAuth();
	let userPermissions;
	if (user) userPermissions = await getUserPermissions(user.id);
	if (!userPermissions?.canCreateTasks) return notFound();

	const users = (await prisma.user.findMany({ select: { id: true, firstName: true, lastName: true, department: true } })) as SelectionUser[];
	// Define a type SelectionUser from the type returned by prisma.user.findMany

	return (
		<Card className="container mx-auto px-4 py-8 md:px-6 md:py-12">
			<TaskForm users={users} />
		</Card>
	);
};

export default NewTaskPage;
