import { TaskExtended } from "@/app/(protected)/tasks/page";
import { UserExtended } from "@/app/users/_actions/getUserById";
import { dueColor, formatDate } from "@/lib/utilityFunctions";
import { cn } from "@/lib/utils";
import { CornerDownRight } from "lucide-react";
import Link from "next/link";
import { UserAvatarNameSmall } from "../../../../components/AvatarAndName";
import ProgressBar from "../../../../components/ProgressBar";
import StatusBadge from "../../../../components/StatusBadge";
import { TableCell } from "../../../../components/ui/table";
import type { TaskProgress } from "../_actions/taskProgress";

const MobileTaskTabelCell = ({ task, viewableUsers, progress }: { task: TaskExtended; viewableUsers?: string[]; progress?: TaskProgress | null }) => {
	return (
		<TableCell className="space-y-1 py-1 px-1">
			{/* Make the title clickable and dynamically build the URL to the issue page */}
			<Link href={`/tasks/${task.id}`} className="flex items-center gap-2">
				<div className="text-gray-500 dark:text-gray-400 flex gap-x-1 md:hidden">#{task.id}</div>
				{/* A sub-task gets an indent glyph and a link to its parent; a parent gets a count
				    chip - the cheapest way to tell the two kinds of row apart in a flat list, as
				    discussed for the Jira-style epic/story distinction. */}
				{task.parentId && <CornerDownRight className="h-3 w-3 text-muted-foreground shrink-0" data-testid="subtask-indicator" />}
				<span className="truncate md:min-w-0 md:whitespace-normal md:line-clamp-2">{task.title}</span>
				{!!task._count?.children && (
					<span className="text-xs text-muted-foreground shrink-0" data-testid="subtask-count-chip">
						{task._count.children} sub-task{task._count.children === 1 ? "" : "s"}
					</span>
				)}
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
					{/* Stacked under the badge, same reasoning as the desktop Status column - see TaskTable.tsx.
					    The bar's row is always reserved (h-4, even when empty) so the badge lands at the
					    same height whether or not progress applies. */}
					<div className="py-1 flex flex-col items-end gap-1">
						<StatusBadge statusObj={task.status} size="xs" />
						<div className="h-4">{progress && <ProgressBar percent={progress.percent} variant="compact" />}</div>
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
