import { TaskExtended } from "@/app/(protected)/tasks/page";
import { UserExtended } from "@/app/users/getUserById";
import StatusBadge from "@/components/StatusBadge";
import { dueColor, formatDate } from "@/lib/utilityFunctions";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { UserAvatarNameSmall } from "./AvatarAndName";

function MultipleUserTasks({ tasks }: { tasks: TaskExtended[] }) {
	return (
		<div className="grid pr-2 gap-2">
			{tasks.map((task) => (
				<div key={task.id}>
					<div className="flex items-center justify-between">
						<div className="space-y-1 w-5/6">
							<Link href={`/tasks/${task.id}`}>
								<h4 className="text-sm md:text-base">{task.title}</h4>
							</Link>
							<div className="grid grid-cols-2">
								<Link href={`/users/${task.assignedToUserId}`} className="w-fit">
									<UserAvatarNameSmall user={task.assignedToUser as UserExtended} />
								</Link>
								<div id="dates">
									<div className="text-xs text-gray-500 dark:text-gray-400 flex gap-x-1">
										Due on <div className={cn(dueColor(task), "text-xs")}>{formatDate(task.dueDate)}</div>
									</div>
									{task.completedOn && (
										<div className="text-xs text-gray-500 dark:text-gray-400 flex gap-x-1">
											Completed on <div className={cn(dueColor(task), "text-xs")}>{formatDate(task.completedOn)}</div>
										</div>
									)}
								</div>
							</div>
						</div>
						<StatusBadge statusObj={task.status} size="xs" />
					</div>
				</div>
			))}
		</div>
	);
}

export default MultipleUserTasks;
