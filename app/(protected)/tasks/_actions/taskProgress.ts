// Derived completion percentage for a set of tasks.
//
// A task's progress is not stored - it is computed from its (non-cancelled) sub-tasks and its
// checklist items so the two can never drift from what is actually completed. This is done with
// two groupBy aggregates over the whole visible id set, not per-row queries: the tasks list page
// shows 10 rows, but the Excel export can ask for the whole filtered result set at once.

import prisma from "@/prisma/client";

export interface TaskProgress {
	done: number;
	total: number;
	percent: number;
}

/** Just enough of a task to compute its own progress once children/checklist counts are known. */
export interface TaskForProgress {
	id: number;
	statusId: number;
}

/**
 * Progress for each of `tasks`, or null where there is nothing to show (no sub-tasks, no checklist
 * items) - callers should render no ring at all in that case, not a 0% one.
 */
export async function getTaskProgress(tasks: TaskForProgress[]): Promise<Map<number, TaskProgress | null>> {
	const result = new Map<number, TaskProgress | null>();
	if (tasks.length === 0) return result;

	const ids = tasks.map((t) => t.id);

	const [childrenGroups, checklistGroups] = await Promise.all([
		prisma.task.groupBy({
			by: ["parentId", "statusId"],
			where: { parentId: { in: ids }, statusId: { not: 4 } },
			_count: { _all: true },
		}),
		prisma.checklistItem.groupBy({
			by: ["taskId", "done"],
			where: { taskId: { in: ids } },
			_count: { _all: true },
		}),
	]);

	const childTotals = new Map<number, { done: number; total: number }>();
	for (const g of childrenGroups) {
		const parentId = g.parentId as number;
		const entry = childTotals.get(parentId) ?? { done: 0, total: 0 };
		entry.total += g._count._all;
		if (g.statusId === 2 || g.statusId === 3) entry.done += g._count._all;
		childTotals.set(parentId, entry);
	}

	const checklistTotals = new Map<number, { done: number; total: number }>();
	for (const g of checklistGroups) {
		const entry = checklistTotals.get(g.taskId) ?? { done: 0, total: 0 };
		entry.total += g._count._all;
		if (g.done) entry.done += g._count._all;
		checklistTotals.set(g.taskId, entry);
	}

	for (const task of tasks) {
		const children = childTotals.get(task.id);
		const checklist = checklistTotals.get(task.id);
		const total = (children?.total ?? 0) + (checklist?.total ?? 0);

		if (total === 0) {
			result.set(task.id, null);
			continue;
		}

		// A task that is itself Completed or Closed always reads 100%, even if it was finished
		// before all of its checklist items were ticked (the checklist is a helper, not a gate on
		// completing a leaf task the way open sub-tasks are).
		if (task.statusId === 2 || task.statusId === 3) {
			result.set(task.id, { done: total, total, percent: 100 });
			continue;
		}

		const done = (children?.done ?? 0) + (checklist?.done ?? 0);
		result.set(task.id, { done, total, percent: Math.round((done / total) * 100) });
	}

	return result;
}
