import { UserExtended } from "@/app/users/getUserById";
import { UserAvatarNameSmall } from "@/components/AvatarAndName";
import StatusBadge from "@/components/StatusBadge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { completedColor, dueColor, formatDate } from "@/lib/utilityFunctions";
import { cn } from "@/lib/utils";
import { Task } from "@prisma/client";
import { ArrowDownIcon, ArrowUpIcon } from "@radix-ui/react-icons";
import { default as Link, default as NextLink } from "next/link";
import MobileTaskTabelCell from "./MobileTaskTabelCell";
import { TaskExtended } from "./page";

type StatusTypes = "1" | "2" | "3" | "4" | undefined;

export interface TasksQuery {
	status: StatusTypes;
	orderBy: keyof Task;
	sortOrder: "asc" | "desc";
	page: string;
	user: string;
	search: string;
}

interface Props {
	searchParams: TasksQuery;
	tasks: TaskExtended[];
	viewableUsers: string[];
}

const TaskTable = ({ searchParams, tasks, viewableUsers }: Props) => {
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
						<MobileTaskTabelCell task={task} viewableUsers={viewableUsers} />
						<TableCell className="hidden py-1 md:table-cell">
							<StatusBadge statusObj={task.status} size="xs" />
						</TableCell>
						<TableCell className="hidden py-1 md:table-cell">{formatDate(task.createdAt)}</TableCell>
						<TableCell className={cn(dueColor(task), "hidden py-1 md:table-cell")}>{formatDate(task.dueDate)}</TableCell>
						{task.completedOn ? <TableCell className={cn(completedColor(task), "hidden py-1 md:table-cell")}>{formatDate(task.completedOn)}</TableCell> : null}
						<TableCell className="hidden py-1 md:table-cell">
							{task.assignedToUser && viewableUsers.includes(task.assignedToUser.id) ? (
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
	{ label: "Title", value: "title", className: "py-1" },
	{
		label: "Status",
		value: "statusId",
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
