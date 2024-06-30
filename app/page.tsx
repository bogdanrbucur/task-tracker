import { Card } from "@/components/ui/card";
import prisma from "@/prisma/client";
import { TaskExtended } from "./(protected)/tasks/page";
import DepartmentsChart from "./DepartmentsChart";
import MyTasks from "./MyTasks";
import StatusChart from "./StatusChart";
import TeamTasks from "./TeamTasks";
import { getAuth } from "./_auth/actions/get-auth";
import departmentTasks, { DeptTaskChartData } from "./deptTasksChartData";
import statusTasks, { StatusTasksChartData } from "./statusTasksChartData";
import getUserDetails, { prismaExtendedUserSelection } from "./users/getUserById";

export type StatusColors = {
	inprogress: string;
	completed: string;
	overdue: string;
};
const statusColors: StatusColors = { inprogress: "#3b82f6", completed: "#16a34a", overdue: "#dc2626" };

export default async function Home() {
	// Check user permissions
	const { user } = await getAuth();

	let userDetails = undefined;
	let hasSubordinates = false;

	const allTasks = (await prisma.task.findMany({
		include: {
			status: true,
			createdByUser: true,
			assignedToUser: {
				select: prismaExtendedUserSelection,
			},
		},
	})) as TaskExtended[];
	const activeTasks = allTasks.filter((task) => task.statusId !== 3 && task.statusId !== 4);
	const deptTasksChartData = departmentTasks(activeTasks);
	const statusTasksChartData = statusTasks(activeTasks);

	// TODO fix guest mobile view...
	if (!user) return <GuestView statusTasksChartData={statusTasksChartData} deptTasksChartData={deptTasksChartData} />;
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

	// TODO move this crap to a function
	let teamTasks;
	if (hasSubordinates) {
		const subordinatesIds = activeSubordinates.map((subordinate) => subordinate.id);
		teamTasks = allTasks.filter((task) => subordinatesIds.includes(task.assignedToUserId!));
		teamTasks = teamTasks.filter((task) => task.statusId !== 3 && task.statusId !== 4);

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
				<StatusChart data={statusTasksChartData} colors={statusColors} />
				<div className="fade-in enter- row-span-2 flex flex-col h-full ">
					{userDetails && <MyTasks tasks={userDetails?.assignedTasks} hasSubordinates={hasSubordinates} />}
					{hasSubordinates && <TeamTasks tasks={teamTasks as TaskExtended[]} />}
				</div>
				<DepartmentsChart data={deptTasksChartData} statusColors={statusColors} />
			</div>
		</Card>
	);
}

function GuestView({ statusTasksChartData, deptTasksChartData }: { statusTasksChartData: StatusTasksChartData[]; deptTasksChartData: DeptTaskChartData[] }) {
	return (
		<Card className="container mx-auto p-0">
			<div className="grid grid-cols-1 md:grid-cols-2 gap-1" style={{ height: "44vh", maxHeight: "44vh" }}>
				<StatusChart data={statusTasksChartData} colors={statusColors} />
				<DepartmentsChart data={deptTasksChartData} statusColors={statusColors} />
			</div>
		</Card>
	);
}
