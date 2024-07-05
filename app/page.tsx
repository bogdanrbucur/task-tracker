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
import { getTeamTasks, userTasks } from "./users/userAndTeamTasks";

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

	if (!user) return <GuestView statusTasksChartData={statusTasksChartData} deptTasksChartData={deptTasksChartData} />;
	userDetails = await getUserDetails(user.id);
	userDetails.assignedTasks = await userTasks(userDetails);

	const activeSubordinates = userDetails.subordinates.filter((subordinate) => subordinate.active);
	if (activeSubordinates.length > 0) hasSubordinates = true;

	const teamTasks = getTeamTasks(userDetails, allTasks);

	return (
		<Card className="container mx-auto p-0">
			<div className="grid grid-rows-2 grid-cols-1 md:grid-cols-2 gap-1" style={{ height: "88vh", maxHeight: "88vh" }}>
				{/* Guests see the charts in mobile view as well, so if user is logged in, isGuest=true */}
				<StatusChart data={statusTasksChartData} colors={statusColors} isGuest={!user && true} />
				<div className="fade-in enter- row-span-2 flex flex-col h-full ">
					{userDetails && <MyTasks tasks={userDetails?.assignedTasks} hasSubordinates={hasSubordinates} />}
					{hasSubordinates && <TeamTasks tasks={teamTasks as TaskExtended[]} />}
				</div>
				<DepartmentsChart data={deptTasksChartData} statusColors={statusColors} isGuest={!user && true} />
			</div>
		</Card>
	);
}

function GuestView({ statusTasksChartData, deptTasksChartData }: { statusTasksChartData: StatusTasksChartData[]; deptTasksChartData: DeptTaskChartData[] }) {
	return (
		<Card className="container mx-auto p-0">
			<div className="grid grid-rows-2 grid-cols-1 md:grid-cols-2 gap-1" style={{ height: "88vh", maxHeight: "88vh" }}>
				<StatusChart data={statusTasksChartData} colors={statusColors} isGuest={true} />
				<DepartmentsChart data={deptTasksChartData} statusColors={statusColors} isGuest={true} />
			</div>
		</Card>
	);
}
