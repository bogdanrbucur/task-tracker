require("dotenv").config({ path: ".env.local" });

async function triggerDailyTasks() {
	const response = await fetch(`${process.env.BASE_URL}/api/dailyTasks`, {
		method: "POST",
	});
	const body = await response.json();


	if (body.ok) {
		console.log("Daily tasks triggered successfully");
	} else {
		console.error("Failed to trigger daily tasks");
	}
}

triggerDailyTasks();
