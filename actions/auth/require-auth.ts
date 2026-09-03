// Authorization helpers shared by server actions and API routes.
//
// Server actions are public HTTP endpoints, not internal functions: anything a form posts is
// attacker-controlled. Identity must always come from the session via getAuth(), never from a
// form field. These helpers exist so every action expresses that the same way.
//
// This module deliberately has no "use server" directive - exporting a plain helper from a
// "use server" module would turn it into a callable endpoint of its own.

import prisma from "@/prisma/client";
import type { User } from "lucia";
import { getAuth } from "./get-auth";
import { getPermissions, type UserPermissions } from "./get-permissions";

// The message actions already return to the client when a check fails
export const PERMISSION_DENIED = "You do not have permission to perform this action.";

export type Actor = { user: User; permissions: UserPermissions };

/** The signed-in user together with their permissions, or null when there is no valid session. */
export async function getActor(): Promise<Actor | null> {
	const { user } = await getAuth();
	if (!user) return null;
	return { user, permissions: await getPermissions(user.id) };
}

/** The signed-in user, but only if they are an admin. */
export async function getAdminActor(): Promise<Actor | null> {
	const actor = await getActor();
	if (!actor?.permissions.isAdmin) return null;
	return actor;
}

/** Just enough of a task to authorize an action against it. */
export type TaskForAuth = {
	id: number;
	statusId: number;
	parentId: number | null;
	assignedToUserId: string | null;
	assignedToUser: { managerId: string | null } | null;
	parent: { statusId: number } | null;
	// Children not yet Completed/Closed/Cancelled - what canCompleteTask needs to gate on.
	_count: { children: number };
};

export async function getTaskForAuth(taskId: number): Promise<TaskForAuth | null> {
	if (!Number.isFinite(taskId)) return null;
	return prisma.task.findUnique({
		where: { id: taskId },
		select: {
			id: true,
			statusId: true,
			parentId: true,
			assignedToUserId: true,
			assignedToUser: { select: { managerId: true } },
			parent: { select: { statusId: true } },
			_count: { select: { children: { where: { statusId: { notIn: [2, 3, 4] } } } } },
		},
	});
}

function isAssigneesManager(task: TaskForAuth, actor: Actor) {
	return !!task.assignedToUser?.managerId && task.assignedToUser.managerId === actor.user.id;
}

/**
 * Who may change a task's content (title, description, due date, parent, checklist membership):
 * an admin, the assignee's manager, or an assignee who is themselves a manager. A plain assignee
 * is deliberately excluded - they may tick checklist items (canToggleChecklist) but not change the
 * task's scope. Mirrors the Edit button's visibility on the detail page and the gate on the edit
 * page (app/(protected)/tasks/[id]/edit/page.tsx).
 */
export function canEditTask(task: TaskForAuth, actor: Actor) {
	if (actor.permissions.isAdmin) return true;
	if (isAssigneesManager(task, actor)) return true;
	return actor.permissions.isManager && task.assignedToUserId === actor.user.id;
}

/**
 * A task's status blocks the very actions canEditTask would otherwise allow - completed/closed
 * tasks are edited through Reopen instead. Mirrors the edit page's own notFound() gate.
 */
export function isTaskEditable(task: { statusId: number }) {
	return task.statusId === 1 || task.statusId === 5;
}

/** Who may complete a task: an admin or the assignee - and only once every sub-task is done. */
export function canCompleteTask(task: TaskForAuth, actor: Actor) {
	if (!(actor.permissions.isAdmin || task.assignedToUserId === actor.user.id)) return false;
	return task._count.children === 0;
}

/** Who may close or reopen a task: an admin or the assignee's manager. */
export function canManageTask(task: TaskForAuth, actor: Actor) {
	return actor.permissions.isAdmin || isAssigneesManager(task, actor);
}

/** Who may cancel a task: an admin or the assignee's manager - and only once every sub-task is done, same as canCompleteTask. */
export function canCancelTask(task: TaskForAuth, actor: Actor) {
	if (!canManageTask(task, actor)) return false;
	return task._count.children === 0;
}

/**
 * A completed/closed sub-task's parent must stay finished until the parent itself is reopened -
 * otherwise the parent's progress ring can silently drop below 100% while its status still reads
 * Completed or Closed.
 */
export function canReopenTask(task: TaskForAuth) {
	if (!task.parent) return true;
	return task.parent.statusId !== 2 && task.parent.statusId !== 3;
}

/**
 * Who may attach files to / remove attachments from a task, by attachment kind:
 *  - "source" attachments describe the work itself, so they follow canEditTask - a plain assignee
 *    cannot add or remove them.
 *  - "completion" attachments are the assignee's proof they did the work, so they follow the same
 *    identity rule as canCompleteTask (an admin or the assignee) - a plain assignee completing
 *    their own task must be able to attach them.
 */
export function canModifyTaskAttachments(task: TaskForAuth, actor: Actor, type: "source" | "completion") {
	if (type === "completion") return actor.permissions.isAdmin || task.assignedToUserId === actor.user.id;
	return canEditTask(task, actor);
}

/**
 * Who may tick/untick a task's checklist items: an admin, the assignee, or the assignee's manager -
 * a deliberately wider set than canEditTask (a plain, non-manager assignee is included here), and
 * only while the task is still open. Ticking a Completed/Closed task's checklist would move its
 * (already-100%) progress ring without changing its status.
 */
export function canToggleChecklist(task: TaskForAuth, actor: Actor) {
	if (!isTaskEditable(task)) return false;
	if (actor.permissions.isAdmin) return true;
	if (task.assignedToUserId === actor.user.id) return true;
	return isAssigneesManager(task, actor);
}

/**
 * Only a task with no children and no parent of its own may be chosen as another task's parent -
 * the hierarchy is exactly one level deep. It must also still be open: a Completed/Closed/Cancelled
 * task attaching a fresh child would let the parent's progress ring drop back below 100% while its
 * status still reads finished.
 */
export function canBeParent(candidate: { parentId: number | null; statusId: number; _count: { children: number } }) {
	if (candidate.parentId !== null) return false;
	return candidate.statusId === 1 || candidate.statusId === 5;
}
