import { Card, CardHeader } from "@/components/ui/card";
import prisma from "@/prisma/client";
import { TaskExtended } from "./(protected)/tasks/page";
import MyTasks from "./MyTasks";
import TeamTasks from "./TeamTasks";
import { getAuth } from "./_auth/actions/get-auth";
import getUserDetails, { prismaExtendedUserSelection } from "./users/getUserById";

export default async function Home() {
	// Check user permissions
	const { user } = await getAuth();

	let userDetails = null;
	let hasSubordinates = false;

	// TODO show the charts...
	if (!user) return <p>Guest user</p>;
	userDetails = await getUserDetails(user.id);

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
	const activeSubordinates = userDetails.subordinates.filter((subordinate) => subordinate.active);
	if (activeSubordinates.length > 0) hasSubordinates = true;

	// !DEBUG
	hasSubordinates = true;

	let teamTasks;
	if (hasSubordinates) {
		const subordinates = await prisma.user.findMany({
			where: {
				managerId: user.id,
			},
		});
		const subordinatesIds = subordinates.map((subordinate) => subordinate.id);
		teamTasks = await prisma.task.findMany({
			where: {
				assignedToUserId: {
					in: subordinatesIds,
				},
				statusId: {
					notIn: [3, 4],
				},
			},
			include: {
				status: true,
				createdByUser: true,
				assignedToUser: {
					select: prismaExtendedUserSelection,
				},
			},
		});

		// Sorth the tasks first by Completed (statusId 2) and then by Due Date
		teamTasks.sort((a, b) => {
			if (a.statusId === 2 && b.statusId !== 2) return -1;
			if (a.statusId !== 2 && b.statusId === 2) return 1;
			if (a.dueDate < b.dueDate) return -1;
			if (a.dueDate > b.dueDate) return 1;
			return 0;
		});
	}

	return (
		<Card className="container mx-auto p-0">
			<div className="grid grid-rows-2 grid-cols-1 md:grid-cols-2 gap-1" style={{ height: "88vh", maxHeight: "88vh" }}>
				<Card id="departments-chart" className="hidden md:block">
					<CardHeader>
						<h4 className="scroll-m-20 text-xl font-semibold tracking-tight">Departments</h4>
					</CardHeader>
				</Card>
				{userDetails && <MyTasks tasks={userDetails?.assignedTasks} hasSubordinates={hasSubordinates} />}
				<Card id="status-chart" className="hidden md:block">
					<CardHeader>
						<h4 className="scroll-m-20 text-xl font-semibold tracking-tight">Status</h4>
					</CardHeader>
				</Card>
				{hasSubordinates && <TeamTasks tasks={teamTasks as TaskExtended[]} />}
			</div>
		</Card>
	);
}
