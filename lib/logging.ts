import fs from "fs-extra";

// Where log files are written. Read per call rather than at module load: this module is imported
// by the Next server, the email worker and the daily task runner, and each loads its own .env
// through dotenv - which may not have run yet when this module is first evaluated.
function logsDir() {
	return process.env.LOGS_PATH || "./logs";
}

// Get today in YYYY.MM.DD.log
function logDate() {
	const now = new Date();
	return `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, "0")}.${String(now.getDate()).padStart(2, "0")}.log`;
}

// Get now in "2018.12.03, 07:32:13.0162 UTC" format
function timestamp() {
	const now = new Date();
	return (
		`${String(now.getUTCFullYear()).padStart(4, "0")}.${String(now.getUTCMonth() + 1).padStart(2, "0")}.${String(now.getUTCDate()).padStart(2, "0")}, ` +
		`${String(now.getUTCHours()).padStart(2, "0")}:${String(now.getUTCMinutes()).padStart(2, "0")}:${String(now.getUTCSeconds()).padStart(2, "0")}.${String(now.getUTCMilliseconds()).padStart(4, "0")} UTC`
	);
}

// The directories already ensured this process lifetime, so the common path is a single append.
// Keyed by directory because LOGS_PATH is read per call.
const readyDirs = new Set<string>();

export default function logger(message: any): void {
	if (typeof message === "object") message = JSON.stringify(message, null, 2);

	console.log(message);

	// Logging must never take a request down with it. A full disk or a logs directory the service
	// user cannot write to is a reason to lose the log line, not to fail the action that emitted it.
	try {
		const dir = logsDir();

		if (!readyDirs.has(dir)) {
			fs.ensureDirSync(dir);
			readyDirs.add(dir);
		}

		// logDate() is called per write, not cached: the server and the email worker are long-lived
		// services that would otherwise keep writing to their start day's file forever.
		fs.appendFileSync(`${dir}/${logDate()}`, `${timestamp()} -> ${message}\n`, "utf8");
	} catch (error) {
		console.error(`Could not write to the log file: ${error instanceof Error ? error.message : error}`);
	}
}
