import { getAuth } from "@/app/_auth/actions/get-auth";
import { getPermissions } from "@/app/_auth/actions/get-permissions";
import getUsers from "@/app/users/getUsers";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { TaskSearchFilter } from "./TaskSearchFilter";
import TaskStatusFilter from "./TaskStatusFilter";
import { TaskUserFilter } from "./TaskUserFilter";

const TaskTopSection = async () => {
	const { user } = await getAuth();

	const userPermissions = await getPermissions(user?.id);
	const canCreateTask = userPermissions?.isAdmin || userPermissions?.isManager;
	let allUsers = await getUsers();
	// Filter out inactive users
	allUsers = allUsers.filter((u) => u.active);

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6 py-1 md:py-3 ">
			<div className="flex space-x-3 justify-between md:justify-start">
				<TaskStatusFilter />
				<TaskUserFilter users={allUsers} />
			</div>
			<div className="flex space-x-3 justify-between md:justify-end">
				<TaskSearchFilter />
				{canCreateTask && (
					<Button asChild size="sm">
						<Link href="/tasks/new" className="space-x-5">
							New Task
						</Link>
					</Button>
				)}
			</div>
		</div>
	);
};

export default TaskTopSection;
