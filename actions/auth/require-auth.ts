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
	assignedToUserId: string | null;
	assignedToUser: { managerId: string | null } | null;
};

export async function getTaskForAuth(taskId: number): Promise<TaskForAuth | null> {
	if (!Number.isFinite(taskId)) return null;
	return prisma.task.findUnique({
		where: { id: taskId },
		select: { id: true, assignedToUserId: true, assignedToUser: { select: { managerId: true } } },
	});
}

function isAssigneesManager(task: TaskForAuth, actor: Actor) {
	return !!task.assignedToUser?.managerId && task.assignedToUser.managerId === actor.user.id;
}

/**
 * Who may change a task's content: an admin, the assignee, or the assignee's manager.
 * Mirrors the gate on the edit page (app/(protected)/tasks/[id]/edit/page.tsx).
 */
export function canEditTask(task: TaskForAuth, actor: Actor) {
	if (actor.permissions.isAdmin) return true;
	if (task.assignedToUserId === actor.user.id) return true;
	return isAssigneesManager(task, actor);
}

/** Who may complete a task: an admin or the assignee. */
export function canCompleteTask(task: TaskForAuth, actor: Actor) {
	return actor.permissions.isAdmin || task.assignedToUserId === actor.user.id;
}

/** Who may close, reopen or cancel a task: an admin or the assignee's manager. */
export function canManageTask(task: TaskForAuth, actor: Actor) {
	return actor.permissions.isAdmin || isAssigneesManager(task, actor);
}

/** Who may attach files to / remove attachments from a task - same rule as editing it. */
export function canModifyTaskAttachments(task: TaskForAuth, actor: Actor) {
	return canEditTask(task, actor);
}
