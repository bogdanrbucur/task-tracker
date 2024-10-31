import { sendEmail } from "@/app/email/email";
import prisma from "@/prisma/client";
import { Task } from "@prisma/client";
import { differenceInCalendarDays, format, isPast, isSameDay, isToday } from "date-fns";
import { isIPv4, isIPv6 } from "net";
import sharp from "sharp";

export function formatDate(date: Date) {
	return format(date, "dd MMM yyyy");
}

export function datesAreEqual(date1: Date, date2: Date) {
	return isSameDay(date1, date2);
}

// Return yellow text color if task is within 10 days of today or red if past due
export function dueColor(task: Task) {
	if (isPast(task.dueDate) || isToday(task.dueDate)) return "text-red-600 dark:text-red-400";
	if (task.statusId === 1 && differenceInCalendarDays(task.dueDate, new Date()) <= 10) return "text-orange-600 dark:text-orange-400";
	return "";
}
// Return yellow text color if task is within 10 days of today or red if past due
export function originalDueColor(task: Task) {
	if (isPast(task.originalDueDate) || isToday(task.originalDueDate)) return "text-red-600 dark:text-red-400";
	if (task.statusId === 1 && differenceInCalendarDays(task.originalDueDate, new Date()) <= 10) return "text-orange-600 dark:text-orange-400";
	return "";
}

// Return red if completed past due date
export function completedColor(task: Task) {
	if (task.completedOn! > task.dueDate) return "text-red-600 dark:text-red-400";
	return "";
}

export async function resizeAndSaveImage(avatarBuffer: Buffer, filePath: string) {
	sharp(avatarBuffer).resize(256, 256).withMetadata().toFile(filePath);
}

// Check all In progress tasks for overdue status and change to Overdue if past due
export async function checkForOverdueTasks() {
	const tasks = await prisma.task.findMany({
		where: {
			AND: [{ statusId: 1 }, { dueDate: { lt: new Date() } }, { completedOn: null }],
		},
		include: { assignedToUser: { select: { email: true, firstName: true, manager: { select: { email: true, firstName: true, lastName: true } } } } },
	});
	// Change status to overdue (5) if task is past due
	tasks.forEach(async (task) => {
		await prisma.task.update({
			where: { id: task.id },
			data: { statusId: 5 },
		});
	});
}

export async function checkIfTaskOverdue(taskId: number) {
	const task = await prisma.task.findUnique({
		where: { id: taskId },
		include: { assignedToUser: { select: { email: true, firstName: true, manager: { select: { email: true, firstName: true, lastName: true } } } } },
	});
	if (task?.statusId === 1 && isPast(task.dueDate)) {
		console.log(`Task ${taskId} is overdue!`);

		// send email notification to assignee and their manager
		await sendEmail({
			recipients: task.assignedToUser ? task.assignedToUser.email : "",
			cc: task.assignedToUser && task.assignedToUser.manager ? task.assignedToUser.manager.email : "",
			emailType: "taskOverdue",
			task: task,
		});

		await prisma.task.update({
			where: { id: taskId },
			data: { statusId: 5 },
		});
	} else if (task?.statusId === 5 && !isPast(task.dueDate)) {
		console.log(`Task ${taskId} is no longer overdue.`);
		await prisma.task.update({
			where: { id: taskId },
			data: { statusId: 1 },
		});
	}
}

// Get today in YYYY.MM.DD.log
export function logDate() {
	let logDate: any = new Date();
	return `${logDate.getFullYear()}.${String(logDate.getMonth() + 1).padStart(2, "0")}.${String(logDate.getDate()).padStart(2, "0")}.log`;
}

export function normalizeIP(ip: string): string {
	if (isIPv4(ip)) {
		return ip;
	} else if (isIPv6(ip)) {
		// Check for IPv4-mapped IPv6 address
		const ipv4Match = ip.match(/::ffff:(\d+\.\d+\.\d+\.\d+)/);
		if (ipv4Match) {
			return ipv4Match[1];
		}
		return ip;
	}
	return ip;
}
