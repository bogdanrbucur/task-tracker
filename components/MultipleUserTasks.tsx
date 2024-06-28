import StatusBadge from "@/components/StatusBadge";
import { dueColor, formatDate } from "@/lib/utilityFunctions";
import { cn } from "@/lib/utils";

import { TaskExtended } from "@/app/(protected)/tasks/page";
import { UserExtended } from "@/app/users/getUserById";
import Link from "next/link";
import { UserAvatarNameSmall } from "./AvatarAndName";

function MultipleUserTasks({ tasks }: { tasks: TaskExtended[] }) {
	return (
		<div className="grid pr-2 gap-2 md:gap-3">
			{tasks.map((task) => (
				<div key={task.id}>
					<div className="flex items-center justify-between">
						<Link href={`/tasks/${task.id}`}>
							<h4 className="font-sm">{task.title}</h4>
							<div className="text-xs text-gray-500 dark:text-gray-400 flex gap-x-1">
								Due on <div className={cn(dueColor(task), "text-xs")}>{formatDate(task.dueDate)}</div>
							</div>
							{task.completedOn && (
								<div className="text-xs text-gray-500 dark:text-gray-400 flex gap-x-1">
									Completed on <div className={cn(dueColor(task), "text-xs")}>{formatDate(task.completedOn)}</div>
								</div>
							)}
						</Link>
						<StatusBadge statusObj={task.status} size="xs" />
					</div>
					<Link href={`/users/${task.assignedToUserId}`}>
						<UserAvatarNameSmall user={task.assignedToUser as UserExtended} />
					</Link>
				</div>
			))}
		</div>
	);
}

export default MultipleUserTasks;
