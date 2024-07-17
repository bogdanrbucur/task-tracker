import { sendEmail } from "@/app/email/email";
import prisma from "@/prisma/client";
import { subDays } from "date-fns";
import { NextRequest, NextResponse } from "next/server";

const dueSoonDays = process.env.DUE_SOON_DAYS ? parseInt(process.env.DUE_SOON_DAYS) : 10;

export async function POST(req: NextRequest) {
	// Check for overduetasks
	const overdueTasks = await prisma.task.findMany({
		where: {
			AND: [{ statusId: 1 }, { dueDate: { lte: new Date() } }, { completedOn: null }],
		},
		include: { assignedToUser: { select: { email: true, firstName: true, manager: { select: { email: true, firstName: true, lastName: true } } } } },
	});

	console.log(`Overdue tasks retrieved: ${overdueTasks.length}...`);
	// Change status to overdue (5) if task is past due

	for (const task of overdueTasks) {
		console.log(`Task ${task.id} is overdue!`);

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
	}

	// Check for due today tasks...
	const dueSoonTasks = await prisma.task.findMany({
		where: {
			AND: [{ statusId: 1 }, { completedOn: null }, { dueSoonReminderSent: false }, { dueDate: { gte: subDays(new Date(), dueSoonDays) } }],
		},
		include: { assignedToUser: { select: { email: true, firstName: true, manager: { select: { email: true, firstName: true, lastName: true } } } } },
	});

	console.log(`Tasks due soon retrieved: ${dueSoonTasks.length}...`);

	for (const task of dueSoonTasks) {
		console.log(`Task ${task.id} is due soon!`);

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
		}
	}

	// Check for expired password reset tokens and delete them
	const usersWithExpiredTokens: Set<string> = new Set();
	try {
		const tokens = await prisma.passwordResetToken.findMany({
			where: { expiresAt: { lte: new Date() } },
		});

		console.log(`${tokens.length} expired password reset tokens found`);

		for (const token of tokens) {
			await prisma.passwordResetToken.delete({ where: { id: token.id } });
			usersWithExpiredTokens.add(token.userId);
		}
	} catch (err) {
		console.log(err);
	}

	// Filter users with expired tokens and keep only the unverified ones
	const allUnverifiedUsers = await prisma.user.findMany({
		where: { status: "unverified" },
		include: { createdByUser: true },
	});

	const unverifiedUsersWithExpiredTokens = allUnverifiedUsers.map((u) => (usersWithExpiredTokens.has(u.id) ? u : null)).filter((u) => u !== null);

	console.log("Unverified users found: ", allUnverifiedUsers.length);
	console.log("Unverified users with expired tokens found: ", unverifiedUsersWithExpiredTokens.length);

	// Email the user creator that the user has not verified their account
	for (const user of unverifiedUsersWithExpiredTokens) {
		await sendEmail({
			recipients: user.createdByUser.email,
			emailType: "newUserNotConfirmed",
			userFirstName: user.firstName,
			userLastName: user.lastName,
			comment: user.id,
		});
	}

	return NextResponse.json({ ok: true });
}
