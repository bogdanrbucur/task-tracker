import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Department } from "@prisma/client";
import { ArrowDownIcon, ArrowUpIcon } from "@radix-ui/react-icons";
import { default as NextLink } from "next/link";
import DeleteDeptButton from "./DeleteDeptButton";
import EditDeptButton from "./EditDeptButton";

export interface DepartmentsQuery {
	page?: string;
	orderBy?: keyof Department;
	sortOrder: "asc" | "desc";
}

export interface DepartmentExpanded extends Department {
	users: { id: string }[];
}

interface Props {
	searchParams: DepartmentsQuery;
	departments: DepartmentExpanded[];
}

const DepartmentsTable = ({ searchParams, departments }: Props) => {
	const sortOrder = searchParams.sortOrder;

	return (
		<Table>
			<TableHeader>
				<TableRow>
					{columns.map((column) => (
						<TableHead key={column.label} className={column.className}>
							{column.value ? (
								<NextLink
									href={{
										query: { ...searchParams, orderBy: column.value, sortOrder: sortOrder === "asc" ? "desc" : "asc" },
									}}
								>
									{column.label}
								</NextLink>
							) : (
								column.label
							)}
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
				{departments.map((dept) => (
					<TableRow key={dept.id}>
						<TableCell className="py-1.5">{dept.name}</TableCell>
						<TableCell className="py-1.5">{dept.users.length}</TableCell>
						<TableCell className="py-1.5 space-x-2">
							<EditDeptButton dept={dept} />
							<DeleteDeptButton dept={dept} />
						</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	);
};

export default DepartmentsTable;

const columns: { label: string; value: keyof DepartmentExpanded | null; className?: string }[] = [
	{ label: "Department name", value: "name", className: "py-1.5" },
	{ label: "Users", value: null, className: "py-1.5" },
	{ label: "Actions", value: null, className: "py-1.5" },
];

export const columnNames = columns.map((column) => column.value);
