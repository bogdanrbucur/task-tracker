require("dotenv").config({ path: ".env.local" });
const log = require("log-to-file");

async function triggerDailyTasks() {
	const request = await fetch(`${process.env.BASE_URL}/api/dailyTasks`, {
		method: "POST",
		body: { token: process.env.DAILY_TASKS_TOKEN },
	});
	const response = await request.json();

	console.log(response);

	if (response.ok) {
		console.log("Daily tasks triggered successfully");
		log(`Daily tasks triggered successfully`, `./logs/${logDate()}`);
	} else {
		console.error(`Failed to trigger daily tasks: ${response.error}`);
		log(`Failed to trigger daily tasks: ${response.error}`, `./logs/${logDate()}`);
	}
}

triggerDailyTasks();

// Get today in YYYY.MM.DD.log
function logDate() {
	let logDate = new Date();
	return `${logDate.getFullYear()}.${String(logDate.getMonth() + 1).padStart(2, "0")}.${String(logDate.getDate()).padStart(2, "0")}.log`;
}
