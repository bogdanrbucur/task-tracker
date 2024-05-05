"use client";

import { DataTableColumnHeader } from "@/components/DataTableColumnHeader";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { TaskExtended } from "./page";

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.

export const columns: ColumnDef<TaskExtended>[] = [
	{
		accessorKey: "title",
		header: ({ column }) => <DataTableColumnHeader column={column} title="Title" />,
	},
	{
		accessorKey: "description",
		header: () => <div className="text-center">Description</div>,
	},
	{
		accessorKey: "status",
		header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
	},
	{
		accessorKey: "assignedTo",
		header: ({ column }) => <DataTableColumnHeader column={column} title="Assigned to" />,
	},
	{
		accessorKey: "createdAt",
		header: ({ column }) => <DataTableColumnHeader column={column} title="Created" />,
		cell: ({ row }) => format(new Date(row.original.createdAt), "dd/MM/yyyy"),
	},
];
