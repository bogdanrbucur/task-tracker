/**
 * v0 by Vercel.
 * @see https://v0.dev/t/JrUA9HgbhjF
 * Documentation: https://v0.dev/docs#integrating-generated-code-into-your-nextjs-app
 */
import TaskHistory from "@/app/(protected)/tasks/[id]/TaskHistory";
import { getAuth } from "@/app/_auth/actions/get-auth";
import { getUserPermissions } from "@/app/_auth/actions/get-permissions";
import { AvatarAndNameLarge } from "@/components/AvatarAndName";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { completedColor, dueColor, formatDate } from "@/lib/utilityFunctions";
import prisma from "@/prisma/client";
import { Calendar as CalendarIcon, Check, SquarePen } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import CommentsSection from "./commentsSection";
import StatusBadge from "@/components/StatusBadge";
import { CloseTaskButton } from "./CloseTaskButton";

// This is the type of the props passed to the page component
interface Props {
	params: { id: string };
}

export default async function TaskDetailsPage({ params }: Props) {
	// error handling if id is not a number
	if (!Number(params.id)) return notFound();

	// Check user permissions
	const { user } = await getAuth();
	let userPermissions;
	if (user) userPermissions = await getUserPermissions(user.id);

	const task = await prisma.task.findUnique({
		where: { id: Number(params.id) },
		include: {
			assignedToUser: true,
			createdByUser: true,
			status: true,
			changes: true,
			comments: true,
		},
	});

	const canCompleteTask = userPermissions?.canCreateTasks || user?.id === task?.assignedToUser?.id;

	// Get all the comments details
	const comments = await prisma.comment.findMany({
		where: { taskId: task!.id },
		select: { user: { select: { firstName: true, lastName: true, department: true } }, comment: true, id: true, time: true },
	});

	const isLoginUserManagerOfAssignedUser = user?.id === task?.assignedToUser?.managerId;

	// If the issue is not found, we return a 404 page, included in Next.js
	if (!task) return notFound();

	return (
		<Card className="container mx-auto px-4 py-8 md:px-6 md:py-12">
			<div className="grid gap-6 md:grid-cols-[2fr_1fr]">
				<div>
					<div className="space-y-4">
						<div>
							<h1 className="text-2xl font-bold">{task.title}</h1>
							<p className="text-gray-500 dark:text-gray-400">{task.description}</p>
						</div>
						<div className="flex items-center gap-4 justify-between">
							<StatusBadge statusObj={task.status} size="sm" />
							<div className="flex gap-4">
								{userPermissions?.canCreateTasks && (
									<Button asChild size="sm">
										<Link href={`/tasks/${task.id}/edit`} className="gap-1">
											Edit
											<SquarePen size="18" />
										</Link>
									</Button>
								)}
								{canCompleteTask && task.statusId === 1 && (
									<Button size="sm" className="gap-1">
										Complete
										<Check size="18" />
									</Button>
								)}
								{isLoginUserManagerOfAssignedUser && task.statusId === 2 && <CloseTaskButton userId={user?.id} taskId={task.id} />}
							</div>
						</div>
						<div className="grid grid-cols-2 lg:grid-cols-4">
							<div id="assignedTo" className="mb-2">
								<div className="mb-2">Assigned to:</div>
								<AvatarAndNameLarge firstName={task.assignedToUser?.firstName} lastName={task.assignedToUser?.lastName} />
							</div>
							<div id="dueOn" className="mb-2">
								<div className="mb-2">Due on:</div>
								<div className="flex items-center">
									<CalendarIcon className="mr-2 h-4 w-4 text-gray-500 dark:text-gray-400" />
									<div className={dueColor(task.dueDate)}>{formatDate(task.dueDate)}</div>
								</div>
							</div>
							{task.completedOn && (
								<div id="completedOn">
									<div className="mb-2">Completed on:</div>
									<div className="flex items-center">
										<CalendarIcon className="mr-2 h-4 w-4 text-gray-500 dark:text-gray-400" />
										<div className={completedColor(task.completedOn, task.dueDate)}>{formatDate(task.completedOn)}</div>
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
					<CommentsSection userId={user?.id} taskId={task.id} comments={comments} />
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
		</Card>
	);
}
