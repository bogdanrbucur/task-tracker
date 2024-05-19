/**
 * v0 by Vercel.
 * @see https://v0.dev/t/HlYD3A9Kfdx
 * Documentation: https://v0.dev/docs#integrating-generated-code-into-your-nextjs-app
 */
import { getAuth } from "@/app/_auth/actions/get-auth";
import { getPermissions } from "@/app/_auth/actions/get-permissions";
import { UserAvatarNameLarge, UserAvatarNameNormal } from "@/components/AvatarAndName";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatDate } from "@/lib/utilityFunctions";
import prisma from "@/prisma/client";
import { KeySquare, SquarePen } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import getUserDetails from "../getUserById";

export const revalidate = 10;

export default async function UserPage({ params }: { params: { id: string } }) {
	// error handling if id is not a number
	if (!params.id) return notFound();

	// Check user permissions
	const { user } = await getAuth();
	const userPermissions = await getPermissions(user?.id);
	if (!userPermissions.isAdmin) return notFound();

	// Get the user details
	const userDetails = await getUserDetails(params.id);

	// Get the status for each task
	const statuses = await prisma.status.findMany();
	userDetails.assignedTasks.forEach((task) => {
		Object.assign(task, { status: statuses.find((status) => status.id === task.statusId) });
	});

	// Sort the tasks by due date
	userDetails.assignedTasks.sort((a, b) => {
		if (a.dueDate < b.dueDate) return -1;
		if (a.dueDate > b.dueDate) return 1;
		return 0;
	});

	// Filter out the tasks with statusId 3 (closed) or 4 (cancelled)
	userDetails.assignedTasks = userDetails.assignedTasks.filter((task) => task.statusId !== 3 && task.statusId !== 4);

	return (
		<Card className="container w-full max-w-5xl">
			<CardHeader>
				<div className="flex items-center justify-between gap-4">
					<UserAvatarNameLarge user={userDetails} />
					<div className="flex gap-2">
						<Button asChild size="sm">
							<Link href={`/users/${userDetails.id}/edit`} className="gap-1">
								Edit
								<SquarePen size="18" />
							</Link>
						</Button>
						{user?.id === userDetails.id && (
							<Button asChild size="sm">
								<Link href={`/users/${userDetails.id}/edit`} className="gap-1">
									Change Password
									<KeySquare size="18" />
								</Link>
							</Button>
						)}
					</div>
				</div>
			</CardHeader>
			<CardContent className="grid gap-6">
				<div className="grid grid-cols-2 gap-4">
					<div>
						<h4 className="scroll-m-20 text-xl font-semibold tracking-tight">Department</h4> <p>{userDetails.department?.name}</p>
					</div>
					{userDetails.manager && (
						<div>
							<h4 className="scroll-m-20 text-xl font-semibold tracking-tight">Manager</h4>{" "}
							<Link href={`/users/${userDetails.manager.id}`}>
								<UserAvatarNameNormal user={userDetails.manager} />
							</Link>
						</div>
					)}
				</div>
				{userDetails.subordinates.length > 0 && (
					<div>
						<h4 className="scroll-m-20 text-xl font-semibold tracking-tight">Subordinates</h4>
						<div className="grid grid-cols-2 gap-4">
							{userDetails.subordinates.map((subordinate) => (
								<Link href={`/users/${subordinate.id}`} key={subordinate.id}>
									<UserAvatarNameNormal user={subordinate} />
								</Link>
							))}
						</div>
					</div>
				)}
				{userDetails.assignedTasks.length > 0 && (
					<div>
						<h4 className="scroll-m-20 text-xl font-semibold tracking-tight">Open Tasks</h4>
						<div className="grid gap-4">
							{userDetails.assignedTasks.map((task) => (
								<div key={task.id}>
									<div className="flex items-center justify-between">
										<Link href={`/tasks/${task.id}`}>
											<h4 className="font-medium">{task.title}</h4>
											<p className="text-sm text-gray-500 dark:text-gray-400">Due: {formatDate(task.dueDate)}</p>
										</Link>
										{/* @ts-ignore */}
										<StatusBadge statusObj={task.status} size="xs" />
									</div>
								</div>
							))}
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
