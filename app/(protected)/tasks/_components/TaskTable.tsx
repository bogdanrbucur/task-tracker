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
		// table-fixed + explicit per-column widths (below) so column widths are identical on every
		// page, regardless of the content each page happens to hold. Without this, the browser
		// auto-sizes columns to their content and every page navigation reflows them.
		<Table className="md:table-fixed">
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
					// Fixed row height so a page of short (one-line) titles is exactly as tall as a page
					// with wrapped two-line titles - the table container no longer jumps between pages.
					// 3.25rem is the tightest that still fits a clamped two-line title without clipping.
					<TableRow key={task.id} className="md:h-[3.70rem]">
						<TableCell className="hidden py-1 md:table-cell">{task.id}</TableCell>
						<MobileTaskTabelCell task={task} viewableUsers={viewableUsers} progress={progressByTaskId?.get(task.id) ?? null} />
						<TableCell className="hidden py-1 md:table-cell">
							{/* Stacked under the badge, not beside it - a bar reads left-to-right as magnitude,
							    so it needs its own line rather than competing with the badge for width. Fits
							    within the badge's own min-w-28, so this adds no new column width. The bar's
							    row is always reserved (h-4, even when empty) rather than only rendered when
							    applicable - the cell's own align-middle centers this whole block, so a
							    variable-height block would center the badge itself at a different height row
							    to row, depending on whether progress applied. */}
							<div className="flex flex-col items-start gap-1">
								<StatusBadge statusObj={task.status} size="xs" />
								<div className="h-4">{progressByTaskId?.get(task.id) && <ProgressBar percent={progressByTaskId.get(task.id)!.percent} variant="compact" />}</div>
							</div>
						</TableCell>
						<TableCell className="hidden py-1 md:table-cell">
							{/* Clamped to two lines (same as Title) so a long source string can't drag the
							    row past its fixed height - full text on hover via the native title tooltip. */}
							<span className="line-clamp-2" title={task.source ?? undefined}>
								{task.source}
							</span>
						</TableCell>
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

// Widths are fixed per column (table-fixed on <Table>) so navigation between pages never reflows
// the layout. The "Assigned to" column carries no width and absorbs the remaining space.
const columns: { label: string; value: keyof Task; className?: string }[] = [
	{ label: "#", value: "id", className: "hidden md:table-cell py-1 md:w-12" },
	{ label: "Title", value: "title", className: "py-1 md:w-96" },
	{
		label: "Status",
		value: "statusId",
		className: "hidden md:table-cell py-1 md:w-36",
	},
	{
		label: "Source",
		value: "source",
		className: "hidden md:table-cell py-1 md:w-36",
	},
	{
		label: "Created",
		value: "createdAt",
		className: "hidden md:table-cell py-1 md:w-32 whitespace-nowrap",
	},
	{
		label: "Due Date",
		value: "dueDate",
		className: "hidden md:table-cell py-1 md:w-32 whitespace-nowrap",
	},
	{
		label: "Completed",
		value: "completedOn",
		className: "hidden md:table-cell py-1 md:w-32 whitespace-nowrap",
	},
	{
		label: "Assigned to",
		value: "assignedToUserId",
		className: "hidden md:table-cell py-1",
	},
];

export const columnNames = columns.map((column) => column.value);
