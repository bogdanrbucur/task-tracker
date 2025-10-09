import { TaskExtended } from "@/app/(protected)/tasks/page";
import { UserExtended } from "@/app/users/_actions/getUserById";
import { dueColor, formatDate } from "@/lib/utilityFunctions";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { UserAvatarNameSmall } from "../../../../components/AvatarAndName";
import StatusBadge from "../../../../components/StatusBadge";
import { TableCell } from "../../../../components/ui/table";

const MobileTaskTabelCell = ({ task, viewableUsers }: { task: TaskExtended; viewableUsers?: string[] }) => {
	return (
		<TableCell className="space-y-1 py-1 px-1">
			{/* Make the title clickable and dynamically build the URL to the issue page */}
			<Link href={`/tasks/${task.id}`} className="flex gap-2">
				<div className="text-gray-500 dark:text-gray-400 flex gap-x-1 md:hidden">#{task.id}</div>
				{task.title}
			</Link>
			{/* visible on mobile but hidden on medium devices and higher */}
			<div className="md:hidden px-0">
				<div className="flex justify-between py-1">
					<div>
						{task.assignedToUser && viewableUsers?.includes(task.assignedToUser.id) ? (
							<Link href={`/users/${task.assignedToUserId}`}>
								<UserAvatarNameSmall user={task.assignedToUser as UserExtended} />
							</Link>
						) : (
							task.assignedToUser && <UserAvatarNameSmall user={task.assignedToUser as UserExtended} />
						)}
					</div>
					<div className="py-1">
						<StatusBadge statusObj={task.status} size="xs" />
					</div>
				</div>
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
		</TableCell>
	);
};

export default MobileTaskTabelCell;
