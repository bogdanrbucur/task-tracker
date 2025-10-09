"use server";
import { prismaRestrictedUserSelection } from "@/app/users/_actions/getUserById";
import prisma from "@/prisma/client";
import { Prisma } from "@prisma/client";
import { TaskExtended } from "../page";

let query: any = {};
export async function getTasksForExport() {
	const tasks = (await prisma.task.findMany(query)) as TaskExtended[];
	const departments = await prisma.department.findMany();
	// Assign the department to the task, based on the assignedToUser's department
	for (const task of tasks) {
		if (task.assignedToUser) task.department = departments.find((dept) => dept.id === task.assignedToUser?.department?.id);
	}

	return tasks;
}

// Set the query for the export
export async function setExportQuery(where: Prisma.TaskWhereInput | undefined, orderBy: Prisma.TaskOrderByWithAggregationInput | undefined) {
	query = {
		where,
		orderBy,
		include: {
			status: true,
			createdByUser: true,
			assignedToUser: {
				//! select: prismaExtendedUserSelection,
				select: prismaRestrictedUserSelection,
			},
		},
	};
}
