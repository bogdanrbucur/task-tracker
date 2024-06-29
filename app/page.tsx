import { Card, CardHeader } from "@/components/ui/card";
import prisma from "@/prisma/client";
import { TaskExtended } from "./(protected)/tasks/page";
import DepartmentsChart from "./DepartmentsChart";
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
	// hasSubordinates = true;

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

	// assign the department to each task
	activeTasks.map((task) => {
		task.department = task.assignedToUser?.department?.name;
	});
	const deptTasksObj: { [key: string]: { inprogress: number; overdue: number; completed: number; slug: string } } = {};
	activeTasks.forEach((task) => {
		if (!task.department) return;
		if (deptTasksObj[task.department]) {
			if (task.statusId === 1) deptTasksObj[task.department].inprogress++;
			if (task.statusId === 2) deptTasksObj[task.department].completed++;
			if (task.statusId === 5) deptTasksObj[task.department].overdue++;
		} else {
			deptTasksObj[task.department] = { inprogress: 0, overdue: 0, completed: 0, slug: "" };
			if (task.statusId === 1) {
				deptTasksObj[task.department].inprogress++;
				deptTasksObj[task.department].slug = "/tasks?status=1";
			}
			if (task.statusId === 2) {
				deptTasksObj[task.department].completed++;
				deptTasksObj[task.department].slug = "/tasks?status=2";
			}
			if (task.statusId === 5) {
				deptTasksObj[task.department].overdue++;
				deptTasksObj[task.department].slug = "/tasks?status=5";
			}
		}
	});

	// TODO filter tasks by department

	const deptTasksArr: { name: string; inprogress: number; completed: number; overdue: number; value: number; slug: string }[] = [];
	Object.keys(deptTasksObj).forEach((key) => {
		deptTasksArr.push({
			name: key,
			inprogress: deptTasksObj[key].inprogress,
			overdue: deptTasksObj[key].overdue,
			completed: deptTasksObj[key].completed,
			slug: deptTasksObj[key].slug,
			value: deptTasksObj[key].inprogress + deptTasksObj[key].overdue + deptTasksObj[key].completed,
		});
	});

	return (
		<Card className="container mx-auto p-0">
			<div className="grid grid-rows-2 grid-cols-1 md:grid-cols-2 gap-1" style={{ height: "88vh", maxHeight: "88vh" }}>
				<DepartmentsChart data={deptTasksArr} />
				<div className="row-span-2 flex flex-col h-full ">
					{userDetails && <MyTasks tasks={userDetails?.assignedTasks} hasSubordinates={hasSubordinates} />}
					{hasSubordinates && <TeamTasks tasks={teamTasks as TaskExtended[]} />}
				</div>
				<Card id="status-chart" className="hidden md:block">
					<CardHeader>
						<h4 className="scroll-m-20 text-xl font-semibold tracking-tight">Status</h4>
					</CardHeader>
				</Card>
			</div>
		</Card>
	);
}
