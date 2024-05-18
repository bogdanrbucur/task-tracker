import { getAuth } from "@/app/_auth/actions/get-auth";
import { getPermissions } from "@/app/_auth/actions/get-permissions";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const TaskTopSection = async () => {
	const { user } = await getAuth();

	const userPermissions = await getPermissions(user?.id);
	const canCreateTask = userPermissions?.isAdmin || userPermissions?.isManager;

	return (
		<div className="flex justify-between py-3">
			<div></div>
			{canCreateTask && (
				<Button asChild variant="outline" size="sm">
					<Link href="/tasks/new">New Task</Link>
				</Button>
			)}
		</div>
	);
};

export default TaskTopSection;
