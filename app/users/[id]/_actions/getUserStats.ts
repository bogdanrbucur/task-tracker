import prisma from "@/prisma/client";

export interface UserStatsInterface {
	taskCompletionTimeVsAvg: number | null;
	taskReviewTimeVsAvg: number | null;
	avgTaskCompletionTime: number;
	avgTaskReviewTime: number;
	completedBeforeDueDate: number | null;
	completedBeforeOriginalDueDate: number | null;
}

export default async function getUserStats(userId: string): Promise<UserStatsInterface | null> {
	const userStats = await prisma.userStats.findFirst({
		where: {
			userId: userId,
		},
	});

	if (!userStats) return null;

	const statsAllUsers = await prisma.userStats.findMany();
	const avgTaskCompletionTime = statsAllUsers.reduce((acc, user) => acc + user.totalDaysWorkingOnTasks!, 0) / statsAllUsers.length;
	const avgTaskReviewTime = statsAllUsers.reduce((acc, user) => acc + user.totalDaysReviewingTasks!, 0) / statsAllUsers.length;

	// Compute the stats

	return {
		// Normalized task completion time vs average: avgComanyCompletionTime / (avgUserCompletionTime + avgComanyCompletionTime)
		taskCompletionTimeVsAvg:
			avgTaskCompletionTime / (userStats.totalDaysWorkingOnTasks! / userStats.noTasksCompleted! + avgTaskCompletionTime)
				? avgTaskCompletionTime / (userStats.totalDaysWorkingOnTasks! / userStats.noTasksCompleted! + avgTaskCompletionTime)
				: null,
		taskReviewTimeVsAvg:
			avgTaskReviewTime / ((userStats.noTasksReviewedClosed! + userStats.noTasksReviewedReopened!) / userStats.totalDaysReviewingTasks! + avgTaskReviewTime)
				? avgTaskReviewTime / ((userStats.noTasksReviewedClosed! + userStats.noTasksReviewedReopened!) / userStats.totalDaysReviewingTasks! + avgTaskReviewTime)
				: null,
		avgTaskCompletionTime: avgTaskCompletionTime,
		avgTaskReviewTime: avgTaskReviewTime,
		// Percentage of tasks completed before current due date
		completedBeforeDueDate: 1 - userStats.noTasksCompletedAfterDueDate! / userStats.noTasksCompleted!,
		// Percentage of tasks completed before original due date
		completedBeforeOriginalDueDate: userStats.noTasksCompletedBeforeOriginalDueDate! / userStats.noTasksCompleted!,
	};
}
