import fs from "fs-extra";

// Get today in YYYY.MM.DD.log
function logDate() {
	let logDate: any = new Date();
	logDate = `${logDate.getFullYear()}.${String(logDate.getMonth() + 1).padStart(2, "0")}.${String(logDate.getDate()).padStart(2, "0")}.log`;
	return logDate;
}

// Get now in "2018.12.03, 07:32:13.0162 UTC" format
function timestamp() {
	const now = new Date();
	return (
		`${String(now.getUTCFullYear()).padStart(4, "0")}.${String(now.getUTCMonth() + 1).padStart(2, "0")}.${String(now.getUTCDate()).padStart(2, "0")}, ` +
		`${String(now.getUTCHours()).padStart(2, "0")}:${String(now.getUTCMinutes()).padStart(2, "0")}:${String(now.getUTCSeconds()).padStart(2, "0")}.${String(now.getUTCMilliseconds()).padStart(4, "0")} UTC`
	);
}

const logfile: string = logDate();
let logFolderReady = false;

export default function logger(message: any): void {
	if (typeof message === "object") message = JSON.stringify(message, null, 2);

	console.log(message);

	// Create ./logs on the first call only
	if (!logFolderReady) {
		fs.ensureDirSync(`./logs`);
		logFolderReady = true;
	}

	fs.appendFileSync(`./logs/${logfile}`, `${timestamp()} -> ${message}\n`, "utf8");
}
