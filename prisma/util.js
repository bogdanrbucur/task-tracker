import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function insertStatuses() {
	// Insert statuses with IDs 1, 2, and 3 if they don't exist
	await prisma.$executeRaw`
  INSERT INTO Status (id, name) SELECT 1, "In Progress" WHERE NOT EXISTS (SELECT 1 FROM Status WHERE id = 1);
  INSERT INTO Status (id, name) SELECT 2, "Completed (Ready for review)" WHERE NOT EXISTS (SELECT 1 FROM Status WHERE id = 2);
  INSERT INTO Status (id, name) SELECT 3, "Completed and closed" WHERE NOT EXISTS (SELECT 1 FROM Status WHERE id = 3);
  INSERT INTO Status (id, name) SELECT 4, "Cancelled" WHERE NOT EXISTS (SELECT 1 FROM Status WHERE id = 4);
  `;
}

const userIds = await prisma.user.findMany({
	select: {
		id: true,
	},
});

const userIdsArray = userIds.map((user) => `'${user.id}'`);

async function insertDummyTasks() {
	const tasks = [];
	for (let i = 1; i <= 10000; i++) {
		tasks.push(
			`("Dummy seeded task ${i}", "Description for dummy seeded and some random seaborn whale redfin herring wordlings task ${i}", ${(i % 3) + 1}, "2024-01-${String(
				(i % 28) + 1
			).padStart(2, "0")}T00:00:00.000Z", "2025-02-${String((i % 28) + 1).padStart(2, "0")}T00:00:00.000Z", "2025-02-${String((i % 28) + 1).padStart(
				2,
				"0"
			)}T00:00:00.000Z", ${userIdsArray[i % userIdsArray.length]})`
		);
	}
	const result = await prisma.$executeRawUnsafe(`
    INSERT INTO Task (title, description, statusId, updatedAt, originalDueDate, dueDate, assignedToUserId)
    VALUES ${tasks.join(", ")}
  `);

	console.log(result);
}

async function main() {
	// await insertStatuses();
	await insertDummyTasks();
}

main();
