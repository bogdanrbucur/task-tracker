"use server";
import { getActor } from "@/actions/auth/require-auth";
import { prismaRestrictedUserSelection } from "@/app/users/_actions/getUserById";
import prisma from "@/prisma/client";
import { buildTaskOrderBy, buildTaskWhere, type TaskExtended, type TasksQuery } from "./buildTaskQuery";
import { getTaskProgress } from "./taskProgress";

/**
 * Tasks matching the caller's current filters, for the Excel export.
 *
 * The filters arrive as an argument. They used to live in a module-level global set during page
 * render, which meant concurrent users overwrote each other's query - and that an export issued
 * before any page render returned every task in the database.
 */
export async function getTasksForExport(searchParams: TasksQuery) {
	// "use server" makes this a public endpoint - it had no session check at all
	const actor = await getActor();
	if (!actor) return [];

	const tasks = (await prisma.task.findMany({
		where: buildTaskWhere(searchParams),
		orderBy: buildTaskOrderBy(searchParams),
		include: {
			status: true,
			createdByUser: true,
			assignedToUser: {
				select: prismaRestrictedUserSelection,
			},
			parent: { select: { id: true, title: true } },
		},
	})) as (TaskExtended & { parent?: { id: number; title: string } | null })[];

	const departments = await prisma.department.findMany();
	// Assign the department to the task, based on the assignedToUser's department
	for (const task of tasks) {
		if (task.assignedToUser) task.department = departments.find((dept) => dept.id === task.assignedToUser?.department?.id);
	}

	// Same shared helper the tasks list page uses, over the whole filtered result set at once -
	// this is exactly the case the helper is built for: it can be far more than one page of 10.
	const progressByTaskId = await getTaskProgress(tasks);
	const tasksWithProgress = tasks.map((task) => ({ ...task, progress: progressByTaskId.get(task.id) ?? null }));

	return tasksWithProgress;
}
