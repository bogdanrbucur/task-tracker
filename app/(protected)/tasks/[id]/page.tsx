/**
 * v0 by Vercel.
 * @see https://v0.dev/t/JrUA9HgbhjF
 * Documentation: https://v0.dev/docs#integrating-generated-code-into-your-nextjs-app
 */
import TaskHistory from "@/app/(protected)/tasks/[id]/TaskHistory";
import { getAuth } from "@/app/_auth/actions/get-auth";
import { getPermissions } from "@/app/_auth/actions/get-permissions";
import { UserExtended, prismaExtendedUserSelection } from "@/app/users/getUserById";
import { UserAvatarNameNormal } from "@/components/AvatarAndName";
import ClientToast from "@/components/ClientToast";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { completedColor, dueColor, formatDate } from "@/lib/utilityFunctions";
import prisma from "@/prisma/client";
import { Calendar as CalendarIcon, SquarePen } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CancelTaskButton } from "./CancelTaskButton";
import { CloseTaskButton } from "./CloseTaskButton";
import CommentsSection from "./CommentsSection";
import { CompleteTaskButton } from "./CompleteTaskButton";
import { ReopenTaskButton } from "./ReopenTaskButton";

interface Props {
	params: { id: string };
	// toast indicates if a toast message should be displayed when loading the page
	searchParams: {
		toastUser?: "success" | "fail";
		toastManager?: "success" | "fail";
	};
}

export default async function TaskDetailsPage({ params, searchParams }: Props) {
	// error handling if id is not a number
	if (!Number(params.id)) return notFound();

	// Check user permissions
	const { user } = await getAuth();
	const userPermissions = await getPermissions(user?.id);

	// Get the task details, along with the assigned user details
	const task = await prisma.task.findUnique({
		where: { id: Number(params.id) },
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
		},
	});
	// If the task is not found, return a 404 page, included in Next.js
	if (!task) return notFound();

	// Get all the comments details
	const comments = await prisma.comment.findMany({
		where: { taskId: task!.id },
		select: { user: { select: { id: true, firstName: true, lastName: true, department: true, avatar: true } }, comment: true, id: true, time: true },
	});

	// Check if the user has the permission to edit the task = is admin, is manager of the assigned user, or is the assigned user
	const canEditTask = userPermissions?.isAdmin || task?.assignedToUser?.manager?.id === user?.id || (userPermissions.isManager && task?.assignedToUser?.id === user?.id);
	const canCompleteTask = userPermissions?.isAdmin || user?.id === task?.assignedToUser?.id;
	const canCloseTask = user?.id === task.assignedToUser?.manager?.id || userPermissions?.isAdmin;
	const canReopenTask = userPermissions?.isAdmin || task?.assignedToUser?.manager?.id === user?.id;
	const canCancelTask = userPermissions?.isAdmin || task?.assignedToUser?.manager?.id === user?.id;

	// Get all active users for the @ mentions
	const users = await prisma.user.findMany({
		where: { active: true },
		select: prismaExtendedUserSelection,
	});

	return (
		<Card className="container mx-auto px-4 py-8 md:px-6 md:py-12">
			<div className="fade-in grid gap-6 md:grid-cols-[2fr_1fr]">
				<div>
					<div className="space-y-4">
						<div>
							<h1 className="text-2xl font-bold">{task.title}</h1>
							<p className="text-gray-500 dark:text-gray-400 whitespace-pre-wrap">{task.description}</p>
						</div>
						<div className="flex items-center gap-4 justify-between">
							<StatusBadge statusObj={task.status} size="sm" />
							<div className="flex gap-4">
								{canEditTask && (task.statusId === 1 || task.statusId === 5) && (
									<Button asChild size="sm">
										<Link href={`/tasks/${task.id}/edit`} className="gap-1">
											Edit
											<SquarePen size="18" />
										</Link>
									</Button>
								)}
								{canReopenTask && (task.statusId === 2 || task.statusId === 3 || task.statusId === 4) && <ReopenTaskButton userId={user?.id} taskId={task.id} />}
								{canCompleteTask && (task.statusId === 1 || task.statusId === 5) && <CompleteTaskButton userId={user?.id} taskId={task.id} />}
								{canCloseTask && task.statusId === 2 && <CloseTaskButton userId={user?.id} taskId={task.id} />}
								{canCancelTask && task.statusId !== 4 && <CancelTaskButton userId={user?.id} taskId={task.id} />}
							</div>
						</div>
						<div className="grid grid-cols-2 lg:grid-cols-4">
							<div id="assignedTo" className="mb-2">
								<div className="mb-2">Assigned to:</div>
								<UserAvatarNameNormal user={task.assignedToUser as UserExtended} />
							</div>
							<div id="dueOn" className="mb-2">
								<div className="mb-2">Due on:</div>
								<div className="flex items-center">
									<CalendarIcon className="mr-2 h-4 w-4 text-gray-500 dark:text-gray-400" />
									<div className={dueColor(task)}>{formatDate(task.dueDate)}</div>
								</div>
							</div>
							{task.completedOn && (
								<div id="completedOn">
									<div className="mb-2">Completed on:</div>
									<div className="flex items-center">
										<CalendarIcon className="mr-2 h-4 w-4 text-gray-500 dark:text-gray-400" />
										<div className={completedColor(task)}>{formatDate(task.completedOn)}</div>
									</div>
								</div>
							)}
							{task.closedOn && (
								<div id="closedOn">
									<div className="mb-2">Closed on:</div>
									<div className="flex items-center">
										<CalendarIcon className="mr-2 h-4 w-4 text-gray-500 dark:text-gray-400" />
										<div>{formatDate(task.closedOn)}</div>
									</div>
								</div>
							)}
						</div>
					</div>
					<Separator className="my-6" />
					<CommentsSection userId={user?.id} taskId={task.id} comments={comments} users={users as UserExtended[]} />
				</div>
				<div className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle>Task History</CardTitle>
						</CardHeader>
						<TaskHistory changes={task.changes} />
					</Card>
				</div>
			</div>
			<ClientToast
				status={searchParams.toastUser}
				message={
					searchParams.toastUser === "success" ? "Email sent to assigned user." : searchParams.toastUser === "fail" ? "Failed to send email to assigned user." : undefined
				}
			/>
			<ClientToast
				status={searchParams.toastManager}
				message={
					searchParams.toastManager === "success"
						? "Email sent to the manager."
						: searchParams.toastManager === "fail"
						? "Failed to send email to the manager."
						: undefined
				}
			/>
		</Card>
	);
}
