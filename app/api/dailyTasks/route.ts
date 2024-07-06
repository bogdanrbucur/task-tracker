import { sendEmail } from "@/app/email/email";
import prisma from "@/prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { subDays } from "date-fns";

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
	overdueTasks.forEach(async (task) => {
		console.log(`Task ${task.id} is overdue!`);

		// send email notification to assignee and their manager
		await sendEmail({
			recipientFirstName: task.assignedToUser ? task.assignedToUser.firstName : "",
			recipients: task.assignedToUser ? task.assignedToUser.email : "",
			cc: task.assignedToUser && task.assignedToUser.manager ? task.assignedToUser.manager.email : "",
			emailType: "taskOverdue",
			taskTitle: task.title,
			dueDate: task.dueDate,
			link: `${process.env.BASE_URL}/tasks/${task.id}`,
		});

		await prisma.task.update({
			where: { id: task.id },
			data: { statusId: 5 },
		});
	});

	// TODO Check for due today tasks...
	//
	const dueSoonTasks = await prisma.task.findMany({
		where: {
			AND: [{ statusId: 1 }, { dueDate: { lte: new Date() } }, { completedOn: null }],
		},
		include: { assignedToUser: { select: { email: true, firstName: true, manager: { select: { email: true, firstName: true, lastName: true } } } } },
	});
	return NextResponse.json({ ok: true });
}
