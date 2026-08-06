"use client";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet } from "lucide-react";
import type { TasksQuery } from "../_actions/buildTaskQuery";
import { generateExcelExport } from "../_actions/excelExport";
import { getTasksForExport } from "../_actions/getTasksForExport";

export default function ExcelExportButton({ searchParams }: { searchParams: TasksQuery }) {
	return (
		<Button type="submit" size="sm" className="gap-1" onClick={() => downloadExport(searchParams)}>
			Export <FileSpreadsheet size="18" />
		</Button>
	);
}

// function to download the excel file
async function downloadExport(searchParams: TasksQuery) {
	// Get the tasks with the same query parameters as the frontend. These are passed explicitly -
	// the server used to hold them in a global shared between users.
	const allTasks = await getTasksForExport(searchParams);
	// Generate the excel file
	const blob = await generateExcelExport(allTasks);

	// Create a URL for the blob and download the file
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = `Tasks.xlsx`;
	a.click();
	URL.revokeObjectURL(url);
}
