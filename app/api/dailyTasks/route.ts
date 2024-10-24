import { sendEmail } from "@/app/email/email";
import { logDate } from "@/lib/utilityFunctions";
import prisma from "@/prisma/client";
import { subDays, subHours } from "date-fns";
import log from "log-to-file";
import { NextRequest, NextResponse } from "next/server";

const dueSoonDays = process.env.DUE_SOON_DAYS ? parseInt(process.env.DUE_SOON_DAYS) : 10;
const overdueForMoreThanDays = process.env.OVERDUE_FOR_MORE_THAN_DAYS ? parseInt(process.env.OVERDUE_FOR_MORE_THAN_DAYS) : 5;
const overdueReminderEvery = process.env.OVERDUE_REMINDER_EVERY_DAYS ? parseInt(process.env.OVERDUE_REMINDER_EVERY_DAYS) : 7;

export async function POST(req: NextRequest) {
	// Read the body in JSON format and check that it contains the correct secret
	try {
		const body = await req.json();
		console.log(`Daily task API called with body ${body}`);
		log(`Daily task API called with body ${body}`, `./logs/${logDate()}`);
		if (body.token !== process.env.DAILY_TASKS_TOKEN) {
			console.log("Token is invalid");
			log("Token is invalid", `./logs/${logDate()}`);
			return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
		}
	} catch (err) {
		return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
	}

	console.log("Token is valid...");
	log("Token is valid...", `./logs/${logDate()}`);

	//
	// Check for overduetasks
	//
	const overdueTasks = await prisma.task.findMany({
		where: {
			AND: [{ statusId: 1 }, { dueDate: { lte: new Date() } }, { completedOn: null }],
		},
		include: { assignedToUser: { select: { email: true, firstName: true, manager: { select: { email: true, firstName: true, lastName: true } } } } },
	});

	console.log(`Overdue tasks retrieved: ${overdueTasks.length}...`);
	log(`Overdue tasks retrieved: ${overdueTasks.length}...`, `./logs/${logDate()}`);

	// Change status to overdue (5) if task is past due
	for (const task of overdueTasks) {
		console.log(`Task ${task.id} is overdue!`);
		log(`Task ${task.id} is overdue!`, `./logs/${logDate()}`);

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
	const dueSoonTasks = await prisma.task.findMany({
		where: {
			AND: [{ statusId: 1 }, { completedOn: null }, { dueSoonReminderSent: false }, { dueDate: { gte: subDays(new Date(), dueSoonDays) } }],
		},
		include: { assignedToUser: { select: { email: true, firstName: true, manager: { select: { email: true, firstName: true, lastName: true } } } } },
	});

	console.log(`Tasks due soon retrieved: ${dueSoonTasks.length}...`);
	log(`Tasks due soon retrieved: ${dueSoonTasks.length}...`, `./logs/${logDate()}`);

	for (const task of dueSoonTasks) {
		console.log(`Task ${task.id} is due soon!`);
		log(`Task ${task.id} is due soon!`, `./logs/${logDate()}`);

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
		} catch (err) {
			console.error(err);
			log(err, `./logs/${logDate()}`);
		}
	}

	//
	// Check for overdue tasks and send reminders
	//

	// Check for overdue tasks overdue for more than overdueForMoreThanDays days and without lastOverdueReminderSentOn
	// OR with lastOverdueReminderSentOn more than 7 days ago
	const overdueTasksForReminder = await prisma.task.findMany({
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

	// For each task, send the overdue reminder email
	for (const task of overdueTasksForReminder) {
		console.log(`Task ${task.id} is overdue for more than ${overdueForMoreThanDays} days!`);
		log(`Task ${task.id} is overdue for more than ${overdueForMoreThanDays} days!`, `./logs/${logDate()}`);

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
	// Check for expired password reset tokens and delete them
	//
	const usersWithExpiredTokens: Set<string> = new Set();
	try {
		const tokens = await prisma.passwordResetToken.findMany({
			where: { expiresAt: { lte: new Date() } },
		});

		console.log(`${tokens.length} expired password reset tokens found`);
		log(`${tokens.length} expired password reset tokens found`, `./logs/${logDate()}`);

		for (const token of tokens) {
			await prisma.passwordResetToken.delete({ where: { id: token.id } });
			usersWithExpiredTokens.add(token.userId);
		}
	} catch (err) {
		console.log(err);
		log(err, `./logs/${logDate()}`);
	}

	// Filter users with expired tokens and keep only the unverified ones
	const allUnverifiedUsers = await prisma.user.findMany({
		where: { status: "unverified" },
		include: { createdByUser: true },
	});

	const unverifiedUsersWithExpiredTokens = allUnverifiedUsers.map((u) => (usersWithExpiredTokens.has(u.id) ? u : null)).filter((u) => u !== null);

	console.log("Unverified users found: ", allUnverifiedUsers.length);
	console.log("Unverified users with expired tokens found: ", unverifiedUsersWithExpiredTokens.length);
	log(`Unverified users found: ${allUnverifiedUsers.length}`, `./logs/${logDate()}`);
	log(`Unverified users with expired tokens found: ${unverifiedUsersWithExpiredTokens.length}`, `./logs/${logDate()}`);

	// Email the user creator that the user has not verified their account
	for (const user of unverifiedUsersWithExpiredTokens) {
		if (!user) continue;
		await sendEmail({
			recipients: user.createdByUser.email,
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
	console.log("Cleared failed login attempts older than 1 hour");
	log("Cleared failed login attempts older than 1 hour", `./logs/${logDate()}`);

	return NextResponse.json({ ok: true });
}
