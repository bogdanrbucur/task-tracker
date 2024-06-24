const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// Check all In progress tasks for overdue status and change to Overdue if past due
async function checkForOverdueTasks() {
	const tasks = await prisma.task.findMany({
		where: {
			AND: [{ statusId: 1 }, { dueDate: { lt: new Date() } }, { completedOn: null }],
		},
	});
	// Change status to overdue (5) if task is past due
	tasks.forEach(async (task) => {
		console.log(`Task ${task.id} is overdue!`);

		// TODO send email notification to assignee and their manager
		//
		await prisma.task.update({
			where: { id: task.id },
			data: { statusId: 5 },
		});
	});
}

async function dailyTasks() {
	// Check for overdue tasks
	await checkForOverdueTasks();
}
dailyTasks();
