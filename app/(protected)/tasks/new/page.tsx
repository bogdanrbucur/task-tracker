import { getAuth } from "@/app/_auth/actions/get-auth";
import { getUserPermissions } from "@/app/_auth/actions/get-permissions";
import { ComboboxDemo } from "@/components/Combobox";
import { DatePicker } from "@/components/DatePicker";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import prisma from "@/prisma/client";
import { notFound } from "next/navigation";
import React from "react";

export type SelectionUser = {
	id: string;
	firstName: string;
	lastName: string | null;
	department: {
		id: number;
		name: string;
	} | null;
};

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
			<div className="container mx-auto max-w-2xl px-4 py-12">
				<h1 className="mb-8 text-3xl font-bold">New Task</h1>
				<form className="space-y-6">
					<div className="space-y-2">
						<label className="text-sm font-medium" htmlFor="title">
							Title
						</label>
						<Input id="title" placeholder="Enter task title" />
					</div>
					<div className="space-y-2">
						<label className="text-sm font-medium" htmlFor="description">
							Description
						</label>
						<Textarea id="description" placeholder="Enter task description" />
					</div>
					<div className="grid grid-cols-2 gap-6">
						<div className="space-y-2">
							<label className="text-sm font-medium" htmlFor="dueDate">
								Due Date
							</label>
							<DatePicker />
						</div>
						<div className="space-y-2">
							<label className="text-sm font-medium" htmlFor="assignedUser">
								Assigned To
							</label>
							<ComboboxDemo />
						</div>
					</div>
					<div className="flex justify-end">
						<Button type="submit">Create Task</Button>
					</div>
				</form>
			</div>
		</Card>
	);
};

export default NewTaskPage;
