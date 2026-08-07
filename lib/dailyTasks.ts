import * as dotenv from "dotenv";
import logger from "./logging.js";

dotenv.config({ path: ".env.local" });

async function triggerDailyTasks() {
	const request = await fetch(`${process.env.BASE_URL}/api/dailyTasks`, {
		method: "POST",
		body: JSON.stringify({ token: process.env.DAILY_TASKS_TOKEN }),
	});
	const response = await request.json();

	if (response.ok) {
		logger("Daily tasks triggered successfully");
	} else {
		logger(`Failed to trigger daily tasks: ${response.error}`);
	}
}

triggerDailyTasks();
