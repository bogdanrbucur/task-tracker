"use server";

// Tasks a user is allowed to pick as a parent: no parent of their own (one level deep only), still
// open (canBeParent - a Completed/Closed/Cancelled task cannot take on new children), and one the
// caller has edit rights over via canEditTask (the same population who could see/manage it anyway).
//
// Kept small and specific rather than reusing the full tasks list query - the parent picker is a
// dropdown, not a filtered/paginated table.

import { canEditTask, getActor } from "@/actions/auth/require-auth";
import prisma from "@/prisma/client";

export interface EligibleParentTask {
	id: number;
	title: string;
	dueDate: Date;
}

export async function getEligibleParentTasks(excludeTaskId?: number): Promise<EligibleParentTask[]> {
	const actor = await getActor();
	if (!actor) return [];

	const candidates = await prisma.task.findMany({
		where: {
			parentId: null,
			statusId: { in: [1, 5] },
			id: excludeTaskId ? { not: excludeTaskId } : undefined,
		},
		select: { id: true, title: true, dueDate: true, statusId: true, assignedToUserId: true, assignedToUser: { select: { managerId: true } } },
		orderBy: { id: "desc" },
		take: 500,
	});

	return candidates
		.filter((task) => canEditTask({ ...task, parentId: null, parent: null, _count: { children: 0 } }, actor))
		.map(({ id, title, dueDate }) => ({ id, title, dueDate }));
}
