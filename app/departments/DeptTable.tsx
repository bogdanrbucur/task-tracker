import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Department } from "@prisma/client";
import EditDeptButton from "./EditDeptButton";

export interface DepartmentsQuery {
	page?: string;
}

const DepartmentsTable = ({ departments }: { departments: Department[] }) => {
	return (
		<Table>
			<TableHeader>
				<TableRow>
					{columns.map((column) => (
						<TableHead key={column.label} className={column.className}>
							{column.label}
						</TableHead>
					))}
				</TableRow>
			</TableHeader>
			<TableBody>
				{departments.map((dept) => (
					<TableRow key={dept.id}>
						<TableCell className="py-1.5">{dept.name}</TableCell>
						<TableCell className="py-1.5">
							<EditDeptButton dept={dept} />
						</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	);
};

export default DepartmentsTable;

const columns: { label: string; value: keyof Department; className?: string }[] = [
	{ label: "Department name", value: "name", className: "py-1.5" },
	{ label: "Rename", value: "name", className: "py-1.5" },
];

export const columnNames = columns.map((column) => column.value);
