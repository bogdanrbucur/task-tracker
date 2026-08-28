/**
 * v0 by Vercel.
 * @see https://v0.dev/t/JrUA9HgbhjF
 * Documentation: https://v0.dev/docs#integrating-generated-code-into-your-nextjs-app
 */
import { getAuth } from "@/actions/auth/get-auth";
import { getPermissions } from "@/actions/auth/get-permissions";
import { canCompleteTask as checkCanCompleteTask, canReopenTask as checkCanReopenTask, canToggleChecklist, getTaskForAuth } from "@/actions/auth/require-auth";
import TaskHistory from "@/app/(protected)/tasks/[id]/_components/TaskHistory";
import { prismaExtendedUserSelection, UserExtended } from "@/app/users/_actions/getUserById";
import { UserAvatarNameNormal, UserAvatarNameSmall } from "@/components/AvatarAndName";
import ClientToast from "@/components/ClientToast";
import ProgressBar from "@/components/ProgressBar";
import RichText from "@/components/RichText";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { completedColor, datesAreEqual, dueColor, formatDate, logVisitor, NavigationSourceTypes, originalDueColor } from "@/lib/utilityFunctions";
import prisma from "@/prisma/client";
import { Calendar as CalendarIcon, Copy, ListPlus, SquarePen } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTaskProgress } from "../_actions/taskProgress";
import AttachmentList from "./_components/AttachmentsList";
import { CancelTaskButton } from "./_components/CancelTaskButton";
import ChecklistSection from "./_components/ChecklistSection";
import { CloseTaskButton } from "./_components/CloseTaskButton";
import CommentsSection from "./_components/CommentsSection";
import { CompleteTaskButton } from "./_components/CompleteTaskButton";
import { ReopenTaskButton } from "./_components/ReopenTaskButton";

interface Props {
	params: { id: string };
	// toast indicates if a toast message should be displayed when loading the page
	searchParams: {
		toastUser?: "success" | "fail";
		toastManager?: "success" | "fail";
		from: NavigationSourceTypes;
		emailId?: string;
	};
}

export default async function TaskDetailsPage({ params, searchParams }: Props) {
	// Destructure and await the id param
	const { id } = await params;
	if (!Number(id)) return notFound();

	// Await the full searchParams object - Next.js 15+ change
	const rawSearchParams = await searchParams;

	// Check user permissions
	const { user } = await getAuth();
	const userPermissions = await getPermissions(user?.id);
	await logVisitor(user, `task ${id}`, rawSearchParams.from);
	// Get the task details, along with the assigned user details
	const task = await prisma.task.findUnique({
		where: { id: Number(id) },
		include: {
			assignedToUser: {
				select: prismaExtendedUserSelection,
			},
			createdByUser: {
				select: prismaExtendedUserSelection,
			},
			status: true,
			changes: true,
			comments: true,
			attachments: true,
			parent: { select: { id: true, title: true, statusId: true } },
			children: {
				orderBy: { id: "asc" },
				include: { status: true, assignedToUser: { select: prismaExtendedUserSelection } },
			},
			checklistItems: {
				orderBy: { position: "asc" },
				include: { completedBy: { select: { firstName: true, lastName: true } } },
			},
		},
	});
	// If the task is not found, return a 404 page, included in Next.js
	if (!task) return notFound();

	// Permission checks that depend on more than identity (open sub-tasks, a finished parent) live
	// in require-auth.ts so the detail page and the server actions agree on the same rule.
	const taskForAuth = await getTaskForAuth(task.id);

	// Batched with the children's own progress in one call (see taskProgress.ts) rather than one
	// query per row - the sub-tasks list shows each child's own completion alongside this task's.
	const progressById = await getTaskProgress([task, ...task.children]);
	const progress = progressById.get(task.id) ?? null;
	const canCreateTask = userPermissions?.isAdmin || userPermissions?.isManager;
	// Mirrors canBeParent (require-auth.ts): only a task with no parent of its own, and still open,
	// may take on a (further) sub-task.
	const canAddSubtask = canCreateTask && task.parentId === null && (task.statusId === 1 || task.statusId === 5);

	// Get all the comments details
	const comments = await prisma.comment.findMany({
		where: { taskId: task!.id },
		select: { user: { select: { id: true, firstName: true, lastName: true, department: true, avatar: true } }, comment: true, id: true, time: true },
	});

	// Check if the user has the permission to edit the task = is admin, is manager of the assigned user, or is the assigned user
	const canEditTask = userPermissions?.isAdmin || task?.assignedToUser?.manager?.id === user?.id || (userPermissions.isManager && task?.assignedToUser?.id === user?.id);
	// canCompleteTask/canReopenTask come from require-auth.ts, not local booleans, because they now
	// also depend on open sub-tasks / the parent's status - the exact same rule the actions enforce.
	const canCompleteTask = !!taskForAuth && !!user && checkCanCompleteTask(taskForAuth, { user, permissions: userPermissions });
	const openChildrenCount = taskForAuth?._count.children ?? 0;
	const canCloseTask = user?.id === task.assignedToUser?.manager?.id || userPermissions?.isAdmin;
	const canReopenTask = (userPermissions?.isAdmin || task?.assignedToUser?.manager?.id === user?.id) && (!taskForAuth || checkCanReopenTask(taskForAuth));
	const reopenBlockedByParent = !!taskForAuth && !checkCanReopenTask(taskForAuth);
	const canToggleTaskChecklist = !!taskForAuth && !!user && canToggleChecklist(taskForAuth, { user, permissions: userPermissions });
	const canCancelTask = userPermissions?.isAdmin || task?.assignedToUser?.manager?.id === user?.id;

	// Get all active users for the @ mentions
	const users = await prisma.user.findMany({
		where: { status: "active" },
		select: prismaExtendedUserSelection,
	});

	return (
		<Card className="container mx-auto px-4 py-4 md:px-6 md:py-10">
			<div className="fade-in grid gap-6 md:grid-cols-[2fr_1fr]">
				{/* min-w-0 keeps wide description content (tables, code) scrolling inside this column */}
				<div className="min-w-0">
					<div className="space-y-4">
						<div>
							{task.parent && (
								<div className="text-sm mb-1" data-testid="parent-task-link">
									Sub-task of{" "}
									<Link href={`/tasks/${task.parent.id}`} className="text-blue-600 hover:underline">
										#{task.parent.id} {task.parent.title}
									</Link>
								</div>
							)}
							<h3 className="text-gray-500 dark:text-gray-400 md:text-l font-bold">#{task.id}</h3>
							<h1 className="text-xl md:text-2xl font-bold">{task.title}</h1>
							{/* Must be a div, not a p - the rendered markdown contains block-level elements */}
							<div className="mt-1" data-testid="task-description">
								<RichText source={task.description} />
							</div>
						</div>
						<div className="grid grid-cols-1 md:flex items-center gap-4 justify-between">
							<div>
								<StatusBadge statusObj={task.status} size="xs md:sm" />
							</div>
							<div className="flex flex-wrap gap-2">
								{canEditTask && (task.statusId === 1 || task.statusId === 5) && (
									<Button asChild size="sm">
										<Link href={`/tasks/${task.id}/edit`} className="gap-1">
											Edit
											<SquarePen size="18" />
										</Link>
									</Button>
								)}
								{canCreateTask && (
									<Button asChild size="sm" variant="outline">
										<Link href={`/tasks/new?copyFrom=${task.id}`} className="gap-1">
											Duplicate
											<Copy size="16" />
										</Link>
									</Button>
								)}
								{canAddSubtask && (
									<Button asChild size="sm" variant="outline">
										<Link href={`/tasks/new?parent=${task.id}`} className="gap-1">
											Add sub-task
											<ListPlus size="16" />
										</Link>
									</Button>
								)}
								{canReopenTask && (task.statusId === 2 || task.statusId === 3 || task.statusId === 4) && <ReopenTaskButton taskId={task.id} />}
								{userPermissions?.isAdmin || user?.id === task?.assignedToUser?.id ? (
									openChildrenCount > 0 && (task.statusId === 1 || task.statusId === 5) ? (
										<Button size="sm" disabled title="All sub-tasks must be completed, closed or cancelled first">
											{openChildrenCount} sub-task{openChildrenCount === 1 ? "" : "s"} open
										</Button>
									) : (
										canCompleteTask &&
										(task.statusId === 1 || task.statusId === 5) && (
											<CompleteTaskButton taskId={task.id} taskAttachments={task.attachments.filter((t) => t.type === "completion")} />
										)
									)
								) : null}
								{canCloseTask && task.statusId === 2 && <CloseTaskButton taskId={task.id} />}
								{canCancelTask && task.statusId !== 4 && task.statusId !== 3 && <CancelTaskButton taskId={task.id} />}
							</div>
						</div>
						{reopenBlockedByParent && (task.statusId === 2 || task.statusId === 3) && (
							<p className="text-sm text-muted-foreground">This task&apos;s parent (#{task.parent?.id}) must be reopened before this one can be.</p>
						)}
						<div className="grid grid-cols-2 lg:grid-cols-4 text-sm lg:text-base">
							<div id="assignedTo" className="mb-1 md:mb-2">
								<div className="mb-1 md:mb-2">Assigned to:</div>
								<UserAvatarNameNormal user={task.assignedToUser as UserExtended} />
							</div>
							<div id="createdOn" className="mb-1 md:mb-2">
								<div className="mb-1 md:mb-2">Created on:</div>
								<div className="flex items-center">
									<CalendarIcon className="mr-2 h-4 w-4 text-gray-500 dark:text-gray-400" />
									{formatDate(task.createdAt)}
								</div>
							</div>
							{/* Display the Original Due Date only if it's different than the Due Date */}
							{!datesAreEqual(task.originalDueDate, task.dueDate) && (
								<div id="originalDueOn" className="mb-1 md:mb-2">
									<div className="mb-1 md:mb-2">Original due on:</div>
									<div className="flex items-center">
										<CalendarIcon className="mr-2 h-4 w-4 text-gray-500 dark:text-gray-400" />
										<div className={originalDueColor(task)}>{formatDate(task.originalDueDate)}</div>
									</div>
								</div>
							)}
							<div id="dueOn" className="mb-1 md:mb-2">
								<div className="mb-1 md:mb-2">Due on:</div>
								<div className="flex items-center">
									<CalendarIcon className="mr-2 h-4 w-4 text-gray-500 dark:text-gray-400" />
									<div className={dueColor(task)}>{formatDate(task.dueDate)}</div>
								</div>
							</div>
							{task.completedOn && (
								<div id="completedOn">
									<div className="mb-1 md:mb-2">Completed on:</div>
									<div className="flex items-center">
										<CalendarIcon className="mr-2 h-4 w-4 text-gray-500 dark:text-gray-400" />
										<div className={completedColor(task)}>{formatDate(task.completedOn)}</div>
									</div>
								</div>
							)}
							{task.closedOn && (
								<div id="closedOn">
									<div className="mb-1 md:mb-2">Closed on:</div>
									<div className="flex items-center">
										<CalendarIcon className="mr-2 h-4 w-4 text-gray-500 dark:text-gray-400" />
										<div>{formatDate(task.closedOn)}</div>
									</div>
								</div>
							)}
							{task.source && (
								<div id="source">
									<div className="mb-1 md:mb-2">Source:</div>
									<div className="flex items-center">
										<div>{task.source}</div>
									</div>
								</div>
							)}
							{task.sourceLink && (
								<div id="source">
									<a className="mb-1 md:mb-2 text-blue-600 hover:underline" href={task.sourceLink} target="_blank" rel="noopener noreferrer">
										Source Link
									</a>
								</div>
							)}
							{task.attachments.filter((t) => t.type === "source").length > 0 && (
								<div id="source">
									<div className="mb-1 md:mb-2">Source attachments</div>
									<div className="">
										<AttachmentList attachments={task.attachments.filter((a) => a.type === "source")} />
									</div>
								</div>
							)}
							{task.attachments.filter((t) => t.type === "completion").length > 0 && (
								<div id="source">
									<div className="mb-1 md:mb-2">Completion attachments</div>
									<div className="">
										<AttachmentList attachments={task.attachments.filter((a) => a.type === "completion")} />
									</div>
								</div>
							)}
						</div>
						{progress && (
							<div data-testid="task-progress-bar">
								<h2 className="font-bold mb-2">Progress</h2>
								<ProgressBar done={progress.done} total={progress.total} percent={progress.percent} />
							</div>
						)}
						{task.checklistItems.length > 0 && (
							<div>
								<h2 className="font-bold mb-2">Checklist</h2>
								<ChecklistSection items={task.checklistItems} canToggle={canToggleTaskChecklist} />
							</div>
						)}
						{task.children.length > 0 && (
							<div>
								<h2 className="font-bold mb-2">Sub-tasks ({task.children.length})</h2>
								<div className="space-y-2" data-testid="subtasks-list">
									{task.children.map((child) => {
										const childProgress = progressById.get(child.id);
										return (
											<Link
												key={child.id}
												href={`/tasks/${child.id}`}
												className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-2 hover:bg-muted/50"
												data-testid="subtask-row"
											>
												<div className="flex items-center gap-2 min-w-0">
													<span className="text-muted-foreground text-sm">#{child.id}</span>
													<span className="truncate">{child.title}</span>
												</div>
												<div className="flex items-center gap-3 shrink-0">
													{child.assignedToUser && <UserAvatarNameSmall user={child.assignedToUser as UserExtended} />}
													{/* Stacked under the badge, not beside it - same pattern as the tasks table's Status
													    column (see TaskTable.tsx) - and only rendered when progress is applicable. */}
													<div className="flex flex-col items-start gap-1">
														<StatusBadge statusObj={child.status} size="xs" />
														{childProgress && <ProgressBar percent={childProgress.percent} variant="compact" />}
													</div>
												</div>
											</Link>
										);
									})}
								</div>
							</div>
						)}
					</div>
					<Separator className="my-3 md:my-6" />
					<CommentsSection userId={user?.id} taskId={task.id} comments={comments} users={users as UserExtended[]} />
				</div>
				{/* min-w-0 stops long unbreakable strings (e.g. URLs) in the history from widening the grid column */}
				<div className="space-y-6 min-w-0">
					<Card>
						<CardHeader className="px-3 md:px-6 py-3 md:py-6">
							<CardTitle>Task History</CardTitle>
						</CardHeader>
						<TaskHistory changes={task.changes} />
					</Card>
				</div>
			</div>
			<ClientToast
				status={rawSearchParams.toastUser}
				message={
					rawSearchParams.toastUser === "success"
						? "Sending email to assigned user..."
						: rawSearchParams.toastUser === "fail"
						? "Failed to send email to assigned user."
						: undefined
				}
				emailId={rawSearchParams.emailId}
			/>
			<ClientToast
				status={rawSearchParams.toastManager}
				message={
					rawSearchParams.toastManager === "success" ? "Emailing the manager..." : rawSearchParams.toastManager === "fail" ? "Failed to send email to the manager." : undefined
				}
				emailId={rawSearchParams.emailId}
			/>
		</Card>
	);
}
