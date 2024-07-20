"use client";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet } from "lucide-react";
import { generateExcelExport } from "../_actions/excelExport";
import { getTasksForExport } from "../_actions/getTasksForExport";

export default function ExcelExportButton() {
	return (
		<Button type="submit" size="sm" className="gap-1" onClick={downloadExport}>
			Export <FileSpreadsheet size="18" />
		</Button>
	);
}

// function to download the excel file
async function downloadExport() {
	// Get the tasks with the same query parameters as the frontend
	const allTasks = await getTasksForExport();
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
