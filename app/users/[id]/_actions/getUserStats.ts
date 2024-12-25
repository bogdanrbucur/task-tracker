import prisma from "@/prisma/client";

export interface UserStatsInterface {
	taskCompletionTimeVsAvg: number | null;
	taskReviewTimeVsAvg: number | null;
	userAvgTaskCompletionTime: number;
	userAvgTaskReviewTime: number;
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
	const totalDaysWorkingOnTasksAllUsers = statsAllUsers.reduce((acc, user) => acc + user.totalDaysWorkingOnTasks!, 0);
	const totalTasksCompletedAllUsers = statsAllUsers.reduce((acc, user) => acc + user.noTasksCompleted!, 0);
	const globalAvgTaskCompletionTime = totalDaysWorkingOnTasksAllUsers / totalTasksCompletedAllUsers;
	const totalDaysReviewingTasksAllUsers = statsAllUsers.reduce((acc, user) => acc + user.totalDaysReviewingTasks!, 0);
	const totalTasksClosedAllUsers = statsAllUsers.reduce((acc, user) => acc + user.noTasksReviewedClosed!, 0);
	const totalTasksReopenedAllUsers = statsAllUsers.reduce((acc, user) => acc + user.noTasksReviewedReopened!, 0);
	const globalAvgTaskReviewTime = totalDaysReviewingTasksAllUsers / (totalTasksClosedAllUsers + totalTasksReopenedAllUsers);
	const userAvgTaskCompletionTime = userStats.totalDaysWorkingOnTasks! / userStats.noTasksCompleted!;
	const userAvgTaskReviewTime = userStats.totalDaysReviewingTasks! / (userStats.noTasksReviewedClosed! + userStats.noTasksReviewedReopened!);

	// Compute the stats
	return {
		// Normalized task completion time vs average: avgComanyCompletionTime / (avgUserCompletionTime + avgComanyCompletionTime)
		taskCompletionTimeVsAvg:
			globalAvgTaskCompletionTime / (userAvgTaskCompletionTime + globalAvgTaskCompletionTime) && userStats.noTasksCompleted! > 0
				? globalAvgTaskCompletionTime / (userAvgTaskCompletionTime + globalAvgTaskCompletionTime)
				: null,
		taskReviewTimeVsAvg:
			globalAvgTaskReviewTime / (userAvgTaskReviewTime + globalAvgTaskReviewTime) && userStats.noTasksReviewedClosed! + userStats.noTasksReviewedReopened! > 0
				? globalAvgTaskReviewTime / (userAvgTaskReviewTime + globalAvgTaskReviewTime)
				: null,
		userAvgTaskCompletionTime,
		userAvgTaskReviewTime,
		// Percentage of tasks completed before current due date
		completedBeforeDueDate: userStats.noTasksCompleted! > 0 ? 1 - userStats.noTasksCompletedAfterDueDate! / userStats.noTasksCompleted! : null,
		// Percentage of tasks completed before original due date
		completedBeforeOriginalDueDate: userStats.noTasksCompleted! > 0 ? userStats.noTasksCompletedBeforeOriginalDueDate! / userStats.noTasksCompleted! : null,
	};
}
