import XLSX from "xlsx-js-style";
import { TaskExtended } from "../page";

export async function generateExcelExport(tasks: TaskExtended[]) {
	let dataArray = [];
	const headers = [
		"ID",
		"Title",
		"Description",
		"Created",
		"Source",
		"Source Link",
		"Created By",
		"Assigned To",
		"Department",
		"Status",
		"Original due on",
		"Due on",
		"Completed on",
		"Updated At",
	];
	dataArray.push(headers);

	// create the data array
	tasks.forEach((task) => {
		const data = [
			task.id,
			task.title,
			task.description,
			task.createdAt,
			task.source,
			task.sourceLink,
			task.createdByUser ? task.createdByUser.firstName + " " + task.createdByUser.lastName : "",
			`${task.assignedToUser?.firstName} ${task.assignedToUser?.lastName}`,
			task.department?.name,
			task.status?.displayName,
			task.originalDueDate,
			task.dueDate,
			task.completedOn,
			task.updatedAt,
		];
		dataArray.push(data);
	});

	// create the worksheet
	const ws = XLSX.utils.aoa_to_sheet(dataArray);

	// set columns widths, in order starting with A, B etc.
	ws["!cols"] = [
		{ wch: 4 },
		{ wch: 60 },
		{ wch: 80 },
		{ wch: 10 },
		{ wch: 35 },
		{ wch: 10 },
		{ wch: 18 },
		{ wch: 18 },
		{ wch: 15 },
		{ wch: 15 },
		{ wch: 14 },
		{ wch: 10 },
		{ wch: 12 },
		{ wch: 10 },
	];

	// Styling...
	// Center and bold range A1:N1
	for (let col = 0; col <= 13; col++) {
		let row = 0;
		const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
		// if the cell exists (has data)
		if (ws[cellAddress]) {
			// Apply styles
			ws[cellAddress].s = {
				...ws[cellAddress].s,
				alignment: { horizontal: "center", vertical: "center" },
				font: { bold: true },
				fill: { fgColor: { rgb: "BFBFBF" } },
			};
		}
	}

	// Set the hyperlinks for columns 5
	for (let row = 1; row < dataArray.length; row++) {
		const cellAddress = XLSX.utils.encode_cell({ r: row, c: 5 });
		const link = dataArray[row][5];
		// Check that the link is a string and starts with http
		if (link && typeof link === "string" && link.startsWith("http")) {
			ws[cellAddress] = ws[cellAddress] || {};
			ws[cellAddress].l = { Target: link };
			ws[cellAddress].s = { font: { color: { rgb: "0000FF" }, underline: true } };
		}
	}

	// create the workbook
	const wb = XLSX.utils.book_new();
	XLSX.utils.book_append_sheet(wb, ws, "Tasks");

	const binaryData = XLSX.write(wb, { bookType: "xlsx", type: "binary" });

	// Create a Blob from the binary data
	const blob = new Blob([s2ab(binaryData)], { type: "application/octet-stream" });

	return blob;
}

// create a Blob from the binary data
function s2ab(s: string) {
	const buf = new ArrayBuffer(s.length);
	const view = new Uint8Array(buf);
	for (let i = 0; i < s.length; i++) {
		view[i] = s.charCodeAt(i) & 0xff;
	}
	return buf;
}
