import prisma from "@/prisma/client";

export default async function getUserStats(userId: string) {
	const stats = await prisma.userStats.findFirst({
		where: {
			userId: userId,
		},
	});

	if (!stats) return null;

	// Compute the stats

	return {
		completedTasks: stats.noTasksCompleted,
		completedOnTime: stats.noTasksCompletedAfterDueDate! / stats.noTasksCompleted!,
		completedAfterOriginalDueDate: stats.noTasksCompletedBeforeOriginalDueDate! / stats.noTasksCompleted!,
		completedAfterDueDate: stats.noTasksCompletedAfterDueDate! / stats.noTasksCompleted!,
	};
}
