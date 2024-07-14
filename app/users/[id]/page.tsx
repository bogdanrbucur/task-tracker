/**
 * v0 by Vercel.
 * @see https://v0.dev/t/HlYD3A9Kfdx
 * Documentation: https://v0.dev/docs#integrating-generated-code-into-your-nextjs-app
 */
import { getAuth } from "@/app/_auth/actions/get-auth";
import { getPermissions } from "@/app/_auth/actions/get-permissions";
import { UserAvatarNameLarge, UserAvatarNameNormal } from "@/components/AvatarAndName";
import SingleUserTasks from "@/components/SingleUserTasks";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import prisma from "@/prisma/client";
import { SquarePen } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import getUserDetails from "../getUserById";
import ChangePasswordButton from "./ChangePasswordButton";
import ToggleUserButton from "./ToggleUserButton";
import ResetPasswordButton from "./ResetPasswordButton";
import ResendWelcomeEmailButton from "./ResendWelcomeEmailButton";

export const revalidate = 2;

export default async function UserPage({ params }: { params: { id: string } }) {
	// error handling if id is not a number
	if (!params.id) return notFound();

	// Check user permissions
	const { user } = await getAuth();
	if (!user) return notFound();

	const userPermissions = await getPermissions(user?.id);
	// if (!userPermissions.isAdmin && params.id !== user?.id) return notFound();

	// Get the user details
	const userDetails = await getUserDetails(params.id);

	// Get the hashedPassword prop as well, to determine if the user has a password set
	const userWithPassword = await prisma.user.findUnique({
		where: { id: userDetails.id },
		select: { hashedPassword: true, active: true },
	});

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

	const activeSubordinates = userDetails.subordinates.filter((subordinate) => subordinate.status === "active");
	// Filter out the tasks with statusId 3 (closed) or 4 (cancelled)
	userDetails.assignedTasks = userDetails.assignedTasks.filter((task) => task.statusId !== 3 && task.statusId !== 4);
	const tasksNumber = userDetails.assignedTasks.length;
	const subordinatedNumber = activeSubordinates.length;
	const canEdit = userPermissions?.isAdmin || userDetails.id === user?.id;

	// TODO toast notification for password reset email sent

	return (
		<Card className="container w-full max-w-5xl p-0 md:px-7">
			<CardHeader>
				<div className="fade-in flex items-center justify-between gap-4">
					<UserAvatarNameLarge user={userDetails} />
					<div className="flex gap-2">
						{canEdit && (
							<Button asChild size="sm">
								<Link href={`/users/${userDetails.id}/edit`} className="gap-1">
									Edit
									<SquarePen size="18" />
								</Link>
							</Button>
						)}
						{user?.id === userDetails.id && <ChangePasswordButton userId={user.id} />}
						{userPermissions?.isAdmin && user.id !== userDetails.id && userDetails.status === "active" && <ResetPasswordButton userId={userDetails.id} />}
						{userPermissions?.isAdmin && userDetails.status === "unverified" && <ResendWelcomeEmailButton userId={userDetails.id} />}
						{/* Only admins can deactivate users but cannot deactivate themselves */}
						{userPermissions.isAdmin && user.id !== userDetails.id && (
							<ToggleUserButton userId={userDetails.id} status={userDetails.status} tasksNumber={tasksNumber} subordinatesNumber={subordinatedNumber} />
						)}
					</div>
				</div>
				{/* TODO show if the user has confirmed their email or not and if the link expired */}
				{userDetails.status !== "active" && (
					<div id="userStatus" className="text-red-600 dark:text-red-400">
						{userDetails.status}
					</div>
				)}
			</CardHeader>
			<CardContent className="fade-in grid gap-6">
				<div className="grid grid-cols-2 gap-4">
					<div className="space-y-1">
						<h4 className="scroll-m-20 text-xl font-semibold tracking-tight">Department</h4> <p>{userDetails.department?.name}</p>
					</div>
					{userDetails.manager && (
						<div className="space-y-1">
							<h4 className="scroll-m-20 text-xl font-semibold tracking-tight">Manager</h4> <UserAvatarNameNormal user={userDetails.manager} />
						</div>
					)}
				</div>
				{activeSubordinates.length > 0 && (
					<div className="space-y-1">
						<h4 className="scroll-m-20 text-xl font-semibold tracking-tight">Subordinates</h4>
						<div className="grid grid-cols-2 gap-4">
							{activeSubordinates.map((subordinate) => (
								<UserAvatarNameNormal user={subordinate} key={subordinate.id} />
							))}
						</div>
					</div>
				)}
				{userDetails.assignedTasks.length > 0 && (
					<div className="space-y-1">
						<h4 className="scroll-m-20 text-xl font-semibold tracking-tight">Open Tasks</h4>
						<SingleUserTasks tasks={userDetails.assignedTasks} />
					</div>
				)}
			</CardContent>
		</Card>
	);
}
