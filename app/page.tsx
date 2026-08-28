import { Card } from "@/components/ui/card";
import { logVisitor, NavigationSourceTypes } from "@/lib/utilityFunctions";
import prisma from "@/prisma/client";
import { redirect } from "next/navigation";
import { getAuth } from "../actions/auth/get-auth";
import { TaskExtended } from "./(protected)/tasks/page";
import DepartmentsChart from "./_components/DepartmentsChart";
import MyTasks from "./_components/MyTasks";
import StatusChart from "./_components/StatusChart";
import TeamTasks from "./_components/TeamTasks";
import departmentTasks from "./deptTasksChartData";
import statusTasks from "./statusTasksChartData";
import getUserDetails, { prismaRestrictedUserSelection } from "./users/_actions/getUserById";
import { getTeamTasks, userTasks } from "./users/_actions/userAndTeamTasks";

export type StatusColors = {
	inprogress: string;
	completed: string;
	overdue: string;
};

export default async function Home({
	searchParams,
}: {
	searchParams: {
		from: NavigationSourceTypes;
	};
}) {
	// The dashboard is for signed-in users only - guests are sent to sign in
	const { user } = await getAuth();
	if (!user) redirect("/sign-in");

	// Await the full searchParams object - Next.js 15+ change
	const rawSearchParams = await searchParams;

	await logVisitor(user, "the home page", rawSearchParams.from);

	let hasSubordinates = false;

	const allTasks = (await prisma.task.findMany({
		include: {
			status: true,
			createdByUser: true,
			assignedToUser: {
				//! select: prismaExtendedUserSelection,
				select: prismaRestrictedUserSelection,
			},
		},
	})) as TaskExtended[];
	const activeTasks = allTasks.filter((task) => task.statusId !== 3 && task.statusId !== 4);
	const deptTasksChartData = departmentTasks(activeTasks);
	const statusTasksChartData = statusTasks(activeTasks);

	const userDetails = await getUserDetails(user.id);
	userDetails.assignedTasks = await userTasks(userDetails);

	const activeSubordinates = userDetails.subordinates.filter((subordinate) => subordinate.status === "active");
	if (activeSubordinates.length > 0) hasSubordinates = true;

	const teamTasks = getTeamTasks(userDetails, allTasks);

	return (
		<Card className="container mx-auto p-0">
			<div className="grid grid-rows-2 grid-cols-1 md:grid-cols-2 gap-1" style={{ height: "88vh", maxHeight: "88vh" }}>
				<StatusChart data={statusTasksChartData} isGuest={false} />
				<div className="fade-in row-span-2 flex flex-col h-full ">
					{userDetails && <MyTasks tasks={userDetails?.assignedTasks} hasSubordinates={hasSubordinates} />}
					{hasSubordinates && <TeamTasks tasks={teamTasks as TaskExtended[]} />}
				</div>
				<DepartmentsChart data={deptTasksChartData} isGuest={false} />
			</div>
		</Card>
	);
}
