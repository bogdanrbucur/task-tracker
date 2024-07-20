"use server";
import { prismaExtendedUserSelection } from "@/app/users/_actions/getUserById";
import prisma from "@/prisma/client";
import { Prisma } from "@prisma/client";
import { TaskExtended } from "../page";

let query: any = {};
export async function getTasksForExport() {
	return (await prisma.task.findMany(query)) as TaskExtended[];
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
				select: prismaExtendedUserSelection,
			},
		},
	};
}
