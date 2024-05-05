import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Task } from "@prisma/client";
import { ArrowDownIcon, ArrowUpIcon } from "@radix-ui/react-icons";
import { format } from "date-fns";
import NextLink from "next/link";
import { TaskExtended } from "./page";
import Link from "next/link";

type StatusTypes = "1" | "2" | "3" | undefined;

export interface TasksQuery {
	status: StatusTypes;
	orderBy: keyof Task;
	sortOrder: "asc" | "desc";
	page: string;
}

interface Props {
	searchParams: TasksQuery;
	tasks: TaskExtended[];
}

const TaskTable = ({ searchParams, tasks }: Props) => {
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
									query: { ...searchParams, orderBy: column.value, sortOrder: sortOrder === "asc" ? "desc" : "asc" },
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
						<TableCell>
							{/* Make the title clickable and dynamically build the URL to the issue page */}
							<Link href={`/tasks/${task.id}`}>{task.title}</Link>
							{/* visible on mobile but hidden on medium devices and higher */}
							<div className="block md:hidden">{task.status}</div>
						</TableCell>
						<TableCell className="hidden md:table-cell">{task.status}</TableCell>
						<TableCell className="hidden md:table-cell">{formatDate(task.createdAt)}</TableCell>
						<TableCell className="hidden md:table-cell">{task.assignedTo}</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	);
};

export default TaskTable;

const columns: { label: string; value: keyof Task; className?: string }[] = [
	{ label: "Title", value: "title" },
	{ label: "Status", value: "statusId", className: "hidden md:table-cell" },
	{ label: "Created", value: "createdAt", className: "hidden md:table-cell" },
	{ label: "Assigned to", value: "assignedToUserId", className: "hidden md:table-cell" },
];

export const columnNames = columns.map((column) => column.value);

const formatDate = (date: Date) => {
	return format(date, "dd MMM yyyy");
};
