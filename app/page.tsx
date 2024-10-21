import { Card } from "@/components/ui/card";
import { logDate, normalizeIP } from "@/lib/utilityFunctions";
import prisma from "@/prisma/client";
import fs from "fs-extra";
import log from "log-to-file";
import { getAuth } from "../actions/auth/get-auth";
import { TaskExtended } from "./(protected)/tasks/page";
import DepartmentsChart from "./_components/DepartmentsChart";
import MyTasks from "./_components/MyTasks";
import StatusChart from "./_components/StatusChart";
import TeamTasks from "./_components/TeamTasks";
import departmentTasks, { DeptTaskChartData } from "./deptTasksChartData";
import statusTasks, { StatusTasksChartData } from "./statusTasksChartData";
import getUserDetails, { prismaExtendedUserSelection } from "./users/_actions/getUserById";
import { getTeamTasks, userTasks } from "./users/_actions/userAndTeamTasks";
import { headers } from "next/headers";

export type StatusColors = {
	inprogress: string;
	completed: string;
	overdue: string;
};

// If ./logs folder doesn't exist, create it
try {
	fs.ensureDirSync(`./logs`);
} catch (err) {
	console.error(err);
}

export default async function Home() {
	// Get client IP address
	const headersList = headers();
	const rawIP = headersList.get("x-forwarded-for")?.split(",")[0].trim() || headersList.get("x-real-ip") || "";
	const ip = normalizeIP(rawIP);

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

	if (!user) {
		console.log(`A guest visitor accessed the home page from ${ip}.`);
		log(`A guest visitor accessed the home page from ${ip}.`, `./logs/${logDate()}`);
	}

	if (!user) return <GuestView statusTasksChartData={statusTasksChartData} deptTasksChartData={deptTasksChartData} />;
	userDetails = await getUserDetails(user.id);
	userDetails.assignedTasks = await userTasks(userDetails);

	console.log(`User ${userDetails.email} accessed the home page from ${ip}.`);
	log(`User ${userDetails.email} accessed the home page from ${ip}.`, `./logs/${logDate()}`);

	const activeSubordinates = userDetails.subordinates.filter((subordinate) => subordinate.status === "active");
	if (activeSubordinates.length > 0) hasSubordinates = true;

	const teamTasks = getTeamTasks(userDetails, allTasks);

	return (
		<Card className="container mx-auto p-0">
			<div className="grid grid-rows-2 grid-cols-1 md:grid-cols-2 gap-1" style={{ height: "88vh", maxHeight: "88vh" }}>
				{/* Guests see the charts in mobile view as well, so if user is logged in, isGuest=true */}
				<StatusChart data={statusTasksChartData} isGuest={!user && true} />
				<div className="fade-in row-span-2 flex flex-col h-full ">
					{userDetails && <MyTasks tasks={userDetails?.assignedTasks} hasSubordinates={hasSubordinates} />}
					{hasSubordinates && <TeamTasks tasks={teamTasks as TaskExtended[]} />}
				</div>
				<DepartmentsChart data={deptTasksChartData} isGuest={!user && true} />
			</div>
		</Card>
	);
}

function GuestView({ statusTasksChartData, deptTasksChartData }: { statusTasksChartData: StatusTasksChartData[]; deptTasksChartData: DeptTaskChartData[] }) {
	return (
		<Card className="container mx-auto p-0">
			<div className="grid grid-rows-2 grid-cols-1 md:grid-cols-2 gap-1" style={{ height: "88vh", maxHeight: "88vh" }}>
				<StatusChart data={statusTasksChartData} isGuest={true} />
				<DepartmentsChart data={deptTasksChartData} isGuest={true} />
			</div>
		</Card>
	);
}
