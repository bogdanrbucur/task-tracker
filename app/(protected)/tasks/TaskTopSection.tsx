import { getAuth } from "@/app/_auth/actions/get-auth";
import { getUserPermissions } from "@/app/_auth/actions/get-permissions";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const TaskTopSection = async () => {
	const { user } = await getAuth();

	let userPermissions;
	if (user) userPermissions = await getUserPermissions(user.id);

	return (
		<div className="flex my-2 justify-between">
			<div></div>
			{userPermissions?.canCreateTasks && (
				<Button asChild variant="outline" size="sm">
					<Link href="/tasks/new">New Task</Link>
				</Button>
			)}
		</div>
	);
};

export default TaskTopSection;
