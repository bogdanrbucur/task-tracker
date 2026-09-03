import { UserAvatarNameSmall } from "@/components/AvatarAndName";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { isM365Enabled } from "@/lib/m365";
import { ArrowDownIcon, ArrowUpIcon } from "@radix-ui/react-icons";
import { CircleCheck, CircleX } from "lucide-react";
import { default as Link, default as NextLink } from "next/link";
import { UserExtended } from "../_actions/getUserById";

export interface UsersQuery {
	status: string;
	orderBy: keyof UserExtended;
	sortOrder: "asc" | "desc";
	page: string;
	search: string;
}

interface Props {
	searchParams: UsersQuery;
	users: UserExtended[];
}

const UserTable = ({ searchParams, users }: Props) => {
	const sortOrder = searchParams.sortOrder;
	const m365Enabled = isM365Enabled();
	const columns = m365Enabled ? [...baseColumns, m365Column] : baseColumns;

	return (
		// table-fixed + explicit per-column widths (below) so column widths are identical on every
		// page, regardless of the content each page happens to hold. Without this, the browser
		// auto-sizes columns to their content and every page navigation reflows them. Kept to md+
		// so the mobile single-column layout is unaffected.
		<Table className="md:table-fixed">
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
				{users.map((user) => (
					<TableRow key={user.id}>
						<TableCell className="py-1.5">
							{/* Make the title clickable and dynamically build the URL to the issue page */}
							<Link href={`/users/${user.id}`}>
								<UserAvatarNameSmall user={user} />
							</Link>
							{/* visible on mobile but hidden on medium devices and higher */}
							{/* <div className="block md:hidden">
								{user.firstName} {user.lastName}
							</div> */}
						</TableCell>
						<TableCell className="hidden md:table-cell py-1.5 truncate" title={user.department?.name ?? undefined}>
							{user.department?.name}
						</TableCell>
						<TableCell className="py-1.5">
							{user.manager && (
								<Link href={`/users/${user.manager?.id}`}>
									<UserAvatarNameSmall user={user.manager} />
								</Link>
							)}
						</TableCell>
						<TableCell className="hidden md:table-cell py-1.5">
							<Link href={`/tasks?status=1%2C5%2C2&user=${user.id}`}>
								{user.assignedTasks ? user.assignedTasks.filter((task) => task.statusId === 1 || task.statusId === 2 || task.statusId === 5).length : 0}
							</Link>
						</TableCell>
						{m365Enabled && (
							<TableCell className="hidden md:table-cell py-1.5">
								{user.entraOid ? (
									<Badge variant="secondary" className="gap-1.5 py-1 font-normal h-auto whitespace-normal break-all text-left" title={user.entraUpn ?? undefined}>
										<CircleCheck size={14} className="shrink-0 text-green-600 dark:text-green-400" />
										<span>{user.entraUpn ?? "Linked"}</span>
									</Badge>
								) : (
									<Badge variant="outline" className="gap-1.5 py-1 font-normal text-muted-foreground">
										<CircleX size={14} />
										Not linked
									</Badge>
								)}
							</TableCell>
						)}
					</TableRow>
				))}
			</TableBody>
		</Table>
	);
};

export default UserTable;

// Widths are fixed per column (table-fixed on <Table>) so navigation between pages never reflows
// the layout. The Name column carries no width and absorbs the remaining space.
const baseColumns: { label: string; value: keyof UserExtended; className?: string }[] = [
	{ label: "Name", value: "firstName", className: "py-1.5" },
	{ label: "Department", value: "department", className: "hidden md:table-cell py-1.5 md:w-44" },
	{ label: "Manager", value: "manager", className: "md:table-cell py-1.5 md:w-72" },
	{ label: "Open Tasks", value: "assignedTasks", className: "hidden md:table-cell py-1.5 md:w-28" },
];

const m365Column: { label: string; value: keyof UserExtended; className?: string } = {
	label: "Microsoft 365",
	value: "entraOid",
	className: "hidden md:table-cell py-1.5 md:w-80",
};

// isM365Enabled() is a runtime flag, so the sortable column set can't be a fixed module-level
// constant - it has to match whatever UserTable actually renders for a given request.
export const columnNames = (isM365Enabled() ? [...baseColumns, m365Column] : baseColumns).map((column) => column.value);
