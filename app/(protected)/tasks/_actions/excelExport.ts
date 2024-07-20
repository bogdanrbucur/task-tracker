import XLSX from "xlsx-js-style";
import { TaskExtended } from "../page";

export async function generateExcelExport(tasks: TaskExtended[]) {
	let dataArray = [];
	const headers = ["ID", "Title", "Description", "Status", "Created By", "Assigned To", "Due on", "Updated At"];
	dataArray.push(headers);

	// create the data array
	tasks.forEach((task) => {
		const data = [task.id, task.title, task.description, task.status.name, task.createdByUser?.firstName, task.assignedToUser?.firstName, task.dueDate, task.updatedAt];
		dataArray.push(data);
	});

	// create the worksheet
	const ws = XLSX.utils.aoa_to_sheet(dataArray);

	// create the workbook
	const wb = XLSX.utils.book_new();
	XLSX.utils.book_append_sheet(wb, ws, "Tasks");

	const binaryData = XLSX.write(wb, { bookType: "xlsx", type: "binary" });

	// Create a Blob from the binary data
	const blob = new Blob([s2ab(binaryData)], { type: "application/octet-stream" });

	return blob;
}

// create a Blob from the binary data
function s2ab(s: any) {
	const buf = new ArrayBuffer(s.length);
	const view = new Uint8Array(buf);
	for (let i = 0; i < s.length; i++) {
		view[i] = s.charCodeAt(i) & 0xff;
	}
	return buf;
}
