require('dotenv').config()

async function triggerDailyTasks() {
	const response = await fetch(`${process.env.BASE_URL}/api/dailyTasks`, {
		method: "POST",
	});

	if (response.ok) {
		console.log("Daily tasks triggered successfully");
	} else {
		console.error("Failed to trigger daily tasks");
	}
}

triggerDailyTasks();
