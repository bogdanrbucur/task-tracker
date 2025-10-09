import { sendEmail } from "@/app/email/email";
import { logger } from "@/lib/utilityFunctions";
import prisma from "@/prisma/client";
import { addDays, subDays, subHours } from "date-fns";
import { NextRequest, NextResponse } from "next/server";

const dueSoonDays = process.env.DUE_SOON_DAYS ? parseInt(process.env.DUE_SOON_DAYS) : 10;
const overdueForMoreThanDays = process.env.OVERDUE_FOR_MORE_THAN_DAYS ? parseInt(process.env.OVERDUE_FOR_MORE_THAN_DAYS) : 5;
const overdueReminderEvery = process.env.OVERDUE_REMINDER_EVERY_DAYS ? parseInt(process.env.OVERDUE_REMINDER_EVERY_DAYS) : 7;

export async function POST(req: NextRequest) {
	// Read the body in JSON format and check that it contains the correct secret
	try {
		const body = await req.json();
		logger(`Daily task API called`);

		if (body.token !== process.env.DAILY_TASKS_TOKEN) {
			logger("Token is invalid");
			return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
		}
	} catch (err) {
		return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
	}

	logger("Token is valid...");

	//
	// Check for overduetasks
	//
	let overdueTasks = await prisma.task.findMany({
		where: {
			AND: [{ statusId: 1 }, { dueDate: { lte: new Date() } }, { completedOn: null }],
		},
		include: { assignedToUser: { select: { email: true, firstName: true, manager: { select: { email: true, firstName: true, lastName: true } } } } },
	});

	//! DEBUG - check only one particular task
	// overdueTasks = overdueTasks.filter((t) => t.id === 479);

	logger(`Overdue tasks retrieved: ${overdueTasks.length}...`);

	// Change status to overdue (5) if task is past due
	for (const task of overdueTasks) {
		logger(`Task ${task.id} is overdue!`);

		// send email notification to assignee and their manager
		await sendEmail({
			recipients: task.assignedToUser ? task.assignedToUser.email : "",
			cc: task.assignedToUser && task.assignedToUser.manager ? task.assignedToUser.manager.email : "",
			emailType: "taskOverdue",
			task,
		});

		await prisma.task.update({
			where: { id: task.id },
			data: { statusId: 5 },
		});

		// Wait for 1 second to avoid rate limiting
		await new Promise((resolve) => setTimeout(resolve, 1200));
	}

	//
	// Check for due today tasks...
	//
	let dueSoonTasks = await prisma.task.findMany({
		where: {
			AND: [{ statusId: 1 }, { completedOn: null }, { dueSoonReminderSent: false }, { dueDate: { lte: addDays(new Date(), dueSoonDays) } }],
		},
		include: { assignedToUser: { select: { email: true, firstName: true, manager: { select: { email: true, firstName: true, lastName: true } } } } },
	});

	//! DEBUG - check only one particular task
	// dueSoonTasks = dueSoonTasks.filter((t) => t.id === 479);

	logger(`Tasks due soon retrieved: ${dueSoonTasks.length}...`);

	for (const task of dueSoonTasks) {
		logger(`Task ${task.id} is due soon!`);

		try {
			// send email notification to assignee and their manager
			await sendEmail({
				recipients: task.assignedToUser ? task.assignedToUser.email : "",
				emailType: "taskDueSoon",
				task,
			});

			await prisma.task.update({
				where: { id: task.id },
				data: { dueSoonReminderSent: true },
			});
		} catch (err: any) {
			logger(err?.message ? err.message : "Error sending due soon email");
		}
	}

	//
	// Check for overdue tasks and send reminders
	//

	// Check for overdue tasks overdue for more than overdueForMoreThanDays days and without lastOverdueReminderSentOn
	// OR with lastOverdueReminderSentOn more than 7 days ago
	let overdueTasksForReminder = await prisma.task.findMany({
		where: {
			AND: [
				{ statusId: 5 },
				{ completedOn: null },
				{
					OR: [{ lastOverdueReminderSentOn: { lte: subDays(new Date(), overdueReminderEvery) } }, { lastOverdueReminderSentOn: null }],
				},
				{ dueDate: { lte: subDays(new Date(), overdueForMoreThanDays) } },
			],
		},
		include: { assignedToUser: { select: { email: true, firstName: true, manager: { select: { email: true, firstName: true, lastName: true } } } } },
	});

	//! DEBUG - check only one particular task
	// overdueTasksForReminder = overdueTasksForReminder.filter((t) => t.id === 479);

	// For each task, send the overdue reminder email
	for (const task of overdueTasksForReminder) {
		logger(`Task ${task.id} is overdue for more than ${overdueForMoreThanDays} days!`);

		// send email notification to assignee and their manager
		await sendEmail({
			recipients: task.assignedToUser ? task.assignedToUser.email : "",
			cc: task.assignedToUser && task.assignedToUser.manager ? task.assignedToUser.manager.email : "",
			emailType: "taskOverdue",
			task,
		});

		await prisma.task.update({
			where: { id: task.id },
			data: { lastOverdueReminderSentOn: new Date() },
		});

		// Wait for 1 second to avoid rate limiting
		await new Promise((resolve) => setTimeout(resolve, 1200));
	}

	//
	// Check for completed/ready for review tasks and send email reminders
	//

	// Check for tasks that are ready for review and the last email was sent more than 7 days ago
	let tasksReadyForReview = await prisma.task.findMany({
		where: {
			AND: [{ statusId: 2 }, { lastReadyForReviewSentOn: { lte: subDays(new Date(), overdueReminderEvery) } }],
		},
		include: {
			assignedToUser: {
				select: {
					email: true,
					firstName: true,
					lastName: true,
					manager: { select: { email: true, firstName: true, lastName: true, manager: { select: { email: true } } } },
				},
			},
		},
	});

	//! DEBUG - check only one particular task
	// tasksReadyForReview = tasksReadyForReview.filter((t) => t.id === 479);

	for (const task of tasksReadyForReview) {
		logger(`Task ${task.id} is ready for review!`);

		// If the user has no manager, skip it
		if (!task.assignedToUser?.manager) {
			logger("Task assigned to user has no manager, skipping...");
			continue;
		}

		// send email notification to assignee and their manager
		await sendEmail({
			recipients: task.assignedToUser.manager.email,
			cc: task.assignedToUser.manager.manager ? task.assignedToUser.manager.manager.email : "",
			emailType: "taskCompleted",
			userFirstName: task.assignedToUser.firstName,
			userLastName: task.assignedToUser.lastName,
			comment: task.completionComment!,
			task,
		});

		await prisma.task.update({
			where: { id: task.id },
			data: { lastReadyForReviewSentOn: new Date() },
		});

		// Wait for 1 second to avoid rate limiting
		await new Promise((resolve) => setTimeout(resolve, 1200));
	}

	//
	// Check for expired password reset tokens and delete them
	//
	const usersWithExpiredTokens: Set<string> = new Set();
	try {
		const tokens = await prisma.passwordResetToken.findMany({
			where: { expiresAt: { lte: new Date() } },
		});

		logger(`${tokens.length} expired password reset tokens found`);

		for (const token of tokens) {
			await prisma.passwordResetToken.delete({ where: { id: token.id } });
			usersWithExpiredTokens.add(token.userId);
		}
	} catch (err: any) {
		logger(err?.message ? err.message : "Error checking expired password reset tokens");
	}

	// Filter users with expired tokens and keep only the unverified ones
	const allUnverifiedUsers = await prisma.user.findMany({
		where: { status: "unverified" },
		include: { createdByUser: true },
	});

	const unverifiedUsersWithExpiredTokens = allUnverifiedUsers.map((u) => (usersWithExpiredTokens.has(u.id) ? u : null)).filter((u) => u !== null);

	logger(`Unverified users found: ${allUnverifiedUsers.length}`);
	logger(`Unverified users with expired tokens found: ${unverifiedUsersWithExpiredTokens.length}`);

	// Email the user creator that the user has not verified their account
	for (const user of unverifiedUsersWithExpiredTokens) {
		if (!user) continue;
		await sendEmail({
			recipients: user.createdByUser!.email,
			emailType: "newUserNotConfirmed",
			userFirstName: user.firstName,
			userLastName: user.lastName,
			comment: user.id,
		});
	}

	// Clear all records older than 1 hour from the FailedLoginAttempt table
	await prisma.failedLoginAttempt.deleteMany({
		where: {
			timestamp: { lte: subHours(new Date(), 1) },
		},
	});
	logger("Cleared failed login attempts older than 1 hour");

	return NextResponse.json({ ok: true });
}
