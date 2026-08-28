import { UserExtended } from "@/app/users/_actions/getUserById";
import { UserAvatarNameSmall } from "@/components/AvatarAndName";
import ProgressBar from "@/components/ProgressBar";
import StatusBadge from "@/components/StatusBadge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { completedColor, dueColor, formatDate } from "@/lib/utilityFunctions";
import { cn } from "@/lib/utils";
import { Task } from "@prisma/client";
import { ArrowDownIcon, ArrowUpIcon } from "@radix-ui/react-icons";
import { default as Link, default as NextLink } from "next/link";
import type { TaskExtended, TasksQuery } from "../_actions/buildTaskQuery";
import type { TaskProgress } from "../_actions/taskProgress";
import MobileTaskTabelCell from "./MobileTaskTabelCell";

interface Props {
	searchParams: TasksQuery;
	tasks: TaskExtended[];
	viewableUsers: string[];
	progressByTaskId?: Map<number, TaskProgress | null>;
}

const TaskTable = ({ searchParams, tasks, viewableUsers, progressByTaskId }: Props) => {
	const sortOrder = searchParams.sortOrder;

	return (
		<Table>
			<TableHeader>
				<TableRow>
					{columns.map((column) => (
						<TableHead key={column.label} className={column.className}>
							{/* to send multiple query parameters, spread existing query parameter object and add new prop */}
							<NextLink
								href={{
									query: {
										...searchParams,
										orderBy: column.value,
										sortOrder: sortOrder === "asc" ? "desc" : "asc",
									},
								}}
							>
								{column.label}
							</NextLink>
							{column.value === searchParams.orderBy && sortOrder === "asc" ? (
								<ArrowUpIcon className="inline" />
							) : column.value === searchParams.orderBy && sortOrder === "desc" ? (
								<ArrowDownIcon className="inline" />
							) : null}
						</TableHead>
					))}
				</TableRow>
			</TableHeader>
			<TableBody>
				{tasks.map((task) => (
					<TableRow key={task.id}>
						<TableCell className="hidden py-1 md:table-cell">{task.id}</TableCell>
						<MobileTaskTabelCell task={task} viewableUsers={viewableUsers} progress={progressByTaskId?.get(task.id) ?? null} />
						<TableCell className="hidden py-1 md:table-cell">
							{/* Stacked under the badge, not beside it - a bar reads left-to-right as magnitude,
							    so it needs its own line rather than competing with the badge for width. Fits
							    within the badge's own min-w-28, so this adds no new column width. */}
							<div className="flex flex-col items-start gap-1">
								<StatusBadge statusObj={task.status} size="xs" />
								{progressByTaskId?.get(task.id) && <ProgressBar percent={progressByTaskId.get(task.id)!.percent} variant="compact" />}
							</div>
						</TableCell>
						<TableCell className="hidden py-1 md:table-cell">{task.source}</TableCell>
						<TableCell className="hidden py-1 md:table-cell w-min whitespace-nowrap">{formatDate(task.createdAt)}</TableCell>
						<TableCell className={cn(dueColor(task), "hidden py-1 md:table-cell w-min whitespace-nowrap")}>{formatDate(task.dueDate)}</TableCell>
						{task.completedOn ? (
							<TableCell className={cn(completedColor(task), "hidden py-1 md:table-cell w-min whitespace-nowrap")}>{formatDate(task.completedOn)}</TableCell>
						) : (
							<TableCell className={"hidden py-1 md:table-cell"}></TableCell>
						)}
						<TableCell className="hidden py-1 md:table-cell">
							{task.assignedToUser ? (
								<Link href={`/users/${task.assignedToUserId}`}>
									<UserAvatarNameSmall user={task.assignedToUser as UserExtended} />
								</Link>
							) : (
								task.assignedToUser && <UserAvatarNameSmall user={task.assignedToUser as UserExtended} />
							)}
						</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	);
};

export default TaskTable;

const columns: { label: string; value: keyof Task; className?: string }[] = [
	{ label: "#", value: "id", className: "hidden md:table-cell py-1" },
	{ label: "Title", value: "title", className: "py-1" },
	{
		label: "Status",
		value: "statusId",
		className: "hidden md:table-cell py-1",
	},
	{
		label: "Source",
		value: "source",
		className: "hidden md:table-cell py-1",
	},
	{
		label: "Created",
		value: "createdAt",
		className: "hidden md:table-cell py-1",
	},
	{
		label: "Due Date",
		value: "dueDate",
		className: "hidden md:table-cell py-1",
	},
	{
		label: "Completed",
		value: "completedOn",
		className: "hidden md:table-cell py-1",
	},
	{
		label: "Assigned to",
		value: "assignedToUserId",
		className: "hidden md:table-cell py-1",
	},
];

export const columnNames = columns.map((column) => column.value);
