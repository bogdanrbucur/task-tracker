/**
 * v0 by Vercel.
 */
import { getAuth } from "@/actions/auth/get-auth";
import { getPermissions } from "@/actions/auth/get-permissions";
import { UserAvatarNameLarge, UserAvatarNameNormal } from "@/components/AvatarAndName";
import SingleUserTasks from "@/components/SingleUserTasks";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import prisma from "@/prisma/client";
import { format } from "date-fns";
import { SquarePen } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import getUserDetails from "../_actions/getUserById";
import ChangePasswordButton from "./_components/ChangePasswordButton";
import DeleteUserButton from "./_components/DeleteUserButton";
import ResendWelcomeEmailButton from "./_components/ResendWelcomeEmailButton";
import ResetPasswordButton from "./_components/ResetPasswordButton";
import ToggleUserButton from "./_components/ToggleUserButton";

export const revalidate = 2;

export default async function UserPage({ params }: { params: { id: string } }) {
	// error handling if id is not a number
	if (!params.id) return notFound();

	// Check user permissions
	const { user } = await getAuth();
	if (!user) return notFound();

	const userPermissions = await getPermissions(user?.id);

	// Get the user details
	const userDetails = await getUserDetails(params.id);
	if (!userDetails) return notFound();

	// Get the user with the hashed password to determine if the user was ever active
	const userWithPassword = await prisma.user.findUnique({
		where: { id: userDetails.id },
		select: { hashedPassword: true, status: true },
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

	return (
		<Card className="container w-full max-w-5xl p-0 md:px-7">
			<CardHeader>
				<div className="fade-in grid grid-cols-1 md:grid-cols-2 gap-4">
					<UserAvatarNameLarge user={userDetails} />
					<div className="flex gap-2 md:gap-2 items-center justify-center md:justify-end">
						{canEdit && (
							<Button asChild size="sm" className="w-auto">
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
						{/* Can only delete a user if they were never active (don't have a password) and are inactive */}
						{userPermissions.isAdmin && !userWithPassword?.hashedPassword && userWithPassword?.status === "inactive" && <DeleteUserButton userId={userDetails.id} />}
					</div>
				</div>
				{/* show if the user has confirmed their email or not and if the link expired */}
				{userDetails.status !== "active" && (
					<div id="userStatus" className={userDetails.status === "inactive" ? "text-red-600 dark:text-red-400" : "text-yellow-600 dark:text-yellow-400"}>
						{userDetails.status === "unverified" ? `Unverified: last welcome email sent ${format(userDetails.lastWelcomeEmailSent!, "dd MMM yyyy HH:mm")}` : "Inactive"}
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
