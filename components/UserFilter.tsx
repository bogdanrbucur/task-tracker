import React from "react";
import { Input } from "./ui/input";
import { Table } from "@tanstack/react-table";

const UserFilter = ({ table }: { table: Table<any> }) => {
	return (
		<div className="flex items-center py-2">
			<Input
				placeholder="Filter users..."
				value={(table.getColumn("assignedTo")?.getFilterValue() as string) ?? ""}
				onChange={(event) => table.getColumn("assignedTo")?.setFilterValue(event.target.value)}
				className="max-w-sm"
			/>
		</div>
	);
};

export default UserFilter;
