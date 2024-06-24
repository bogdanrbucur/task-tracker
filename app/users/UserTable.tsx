import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowDownIcon, ArrowUpIcon } from "@radix-ui/react-icons";
import { default as Link, default as NextLink } from "next/link";
import { UserAvatarNameNormal, UserAvatarNameSmall } from "@/components/AvatarAndName";
import { UserExtended } from "./getUserById";

export interface UsersQuery {
	active: string;
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
						<TableCell className="hidden md:table-cell py-1.5">{user.department?.name}</TableCell>
						<TableCell className="py-1.5">
							{user.manager && (
								<Link href={`/users/${user.manager?.id}`}>
									<UserAvatarNameSmall user={user.manager} />
								</Link>
							)}
						</TableCell>
						<TableCell className="hidden md:table-cell py-1.5">
							{user.assignedTasks ? user.assignedTasks.filter((task) => task.statusId === 1 || task.statusId === 2 || task.statusId === 5).length : ""}
						</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	);
};

export default UserTable;

const columns: { label: string; value: keyof UserExtended; className?: string }[] = [
	{ label: "Name", value: "firstName", className: "py-1.5" },
	{ label: "Department", value: "department", className: "hidden md:table-cell py-1.5" },
	{ label: "Manager", value: "manager", className: "hidden md:table-cell py-1.5" },
	{ label: "Open Tasks", value: "assignedTasks", className: "hidden md:table-cell py-1.5" },
];

export const columnNames = columns.map((column) => column.value);
