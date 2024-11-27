import { EmailTask } from "@/app/email/email";
import { logDate } from "@/lib/utilityFunctions";
import prisma from "@/prisma/client";
import { differenceInCalendarDays } from "date-fns";
import log from "log-to-file";

export default async function updateUserStats(userId: string, taskAction: "create" | "complete" | "close" | "reopen", task: EmailTask) {
	const today = new Date();
	// Check if the user exists in the stats table
	const userStats = await prisma.userStats.findFirst({
		where: {
			userId,
		},
	});

	// If not, create a new entry
	if (!userStats) {
		await prisma.userStats.create({
			data: {
				userId,
				noTasksCompleted: taskAction === "complete" ? 1 : 0,
				totalDaysWorkingOnTasks: taskAction === "complete" ? differenceInCalendarDays(task.completedOn!, today) : 0,
				totalDaysReviewingTasks: taskAction === "reopen" || taskAction === "close" ? differenceInCalendarDays(task.completedOn!, today) : 0,
				noTasksCreated: taskAction === "create" ? 1 : 0,
				noTasksReviewedClosed: taskAction === "close" ? 1 : 0,
				noTasksReviewedReopened: taskAction === "reopen" ? 1 : 0,
				noTasksCompletedBeforeOriginalDueDate: taskAction === "complete" && task.completedOn! <= task.dueDate ? 1 : 0,
				noTasksCompletedAfterDueDate: taskAction === "complete" && task.completedOn! > task.dueDate ? 1 : 0,
				noTasksCompletedBetweenDueDates: taskAction === "complete" && task.completedOn! > task.originalDueDate! && task.completedOn! <= task.dueDate ? 1 : 0,
			},
		});

		console.log(`User stats entry for ${userId} created.`);
		log(`User stats entry for ${userId} created.`, `${process.env.LOGS_PATH}/${logDate()}`);
	}
	// If the user exists, update the stats
	else {
		await prisma.userStats.update({
			where: { userId },
			data: {
				noTasksCompleted: taskAction === "complete" ? userStats.noTasksCompleted! + 1 : userStats.noTasksCompleted,
				totalDaysWorkingOnTasks:
					taskAction === "complete" ? userStats.totalDaysWorkingOnTasks! + differenceInCalendarDays(task.completedOn!, today) : userStats.totalDaysWorkingOnTasks,
				totalDaysReviewingTasks:
					taskAction === "reopen" || taskAction === "close"
						? userStats.totalDaysReviewingTasks! + differenceInCalendarDays(task.completedOn!, today)
						: userStats.totalDaysReviewingTasks,
				noTasksCreated: taskAction === "create" ? userStats.noTasksCreated! + 1 : userStats.noTasksCreated,
				noTasksReviewedClosed: taskAction === "close" ? userStats.noTasksReviewedClosed! + 1 : userStats.noTasksReviewedClosed,
				noTasksReviewedReopened: taskAction === "reopen" ? userStats.noTasksReviewedReopened! + 1 : userStats.noTasksReviewedReopened,
				noTasksCompletedBeforeOriginalDueDate:
					taskAction === "complete" && task.completedOn! <= task.dueDate
						? userStats.noTasksCompletedBeforeOriginalDueDate! + 1
						: userStats.noTasksCompletedBeforeOriginalDueDate,
				noTasksCompletedAfterDueDate:
					taskAction === "complete" && task.completedOn! > task.dueDate ? userStats.noTasksCompletedAfterDueDate! + 1 : userStats.noTasksCompletedAfterDueDate,
				noTasksCompletedBetweenDueDates:
					taskAction === "complete" && task.completedOn! > task.originalDueDate! && task.completedOn! <= task.dueDate
						? userStats.noTasksCompletedBetweenDueDates! + 1
						: userStats.noTasksCompletedBetweenDueDates,
			},
		});

		console.log(`User stats entry for ${userId} updated.`);
		log(`User stats entry for ${userId} updated.`, `${process.env.LOGS_PATH}/${logDate()}`);
	}
}
