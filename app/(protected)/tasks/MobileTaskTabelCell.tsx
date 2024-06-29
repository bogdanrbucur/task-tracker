import { TaskExtended } from "@/app/(protected)/tasks/page";
import { UserExtended } from "@/app/users/getUserById";
import { dueColor, formatDate } from "@/lib/utilityFunctions";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { UserAvatarNameSmall } from "../../../components/AvatarAndName";
import StatusBadge from "../../../components/StatusBadge";
import { TableCell } from "../../../components/ui/table";

const MobileTaskTabelCell = ({ task, viewableUsers }: { task: TaskExtended; viewableUsers?: string[] }) => {
	return (
		<TableCell className="space-y-1 py-1 px-1">
			{/* Make the title clickable and dynamically build the URL to the issue page */}
			<Link href={`/tasks/${task.id}`}>{task.title}</Link>
			{/* visible on mobile but hidden on medium devices and higher */}
			<div className="flex md:hidden items-center justify-between">
				<div className="grid grid-cols-2 w-5/6">
					<div className="spacep-y-1">
						{task.assignedToUser && viewableUsers?.includes(task.assignedToUser.id) ? (
							<Link href={`/users/${task.assignedToUserId}`}>
								<UserAvatarNameSmall user={task.assignedToUser as UserExtended} />
							</Link>
						) : (
							task.assignedToUser && <UserAvatarNameSmall user={task.assignedToUser as UserExtended} />
						)}
					</div>
					<div id="dates" className="block md:hidden">
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
				<StatusBadge statusObj={task.status} size="xs" />
			</div>
			<div className="block md:hidden"></div>
		</TableCell>
	);
};

export default MobileTaskTabelCell;
