import { sendEmail } from "@/app/email/email";
import getUserDetails from "@/app/users/_actions/getUserById";
import prisma from "@/prisma/client";
import { Task } from "@prisma/client";
import { differenceInCalendarDays, format, isPast, isSameDay, isToday } from "date-fns";
import log from "log-to-file";
import { User } from "lucia";
import { isIPv4, isIPv6 } from "net";
import { headers } from "next/headers";
import sharp from "sharp";

export function formatDate(date: Date) {
	const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
	return format(localDate, "dd MMM yyyy");
}

export function formatDateWithTime(date: Date) {
	const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
	return format(localDate, "dd MMM yyyy HH:mm");
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
		logger(`Task ${taskId} is overdue!`);

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
		logger(`Task ${taskId} is no longer overdue.`);
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

export type NavigationSourceTypes = "emailNewTask" | "emailTaskDueSoon" | "emailTaskOverdue" | "emailTaskReadyForReview" | null;

export async function logVisitor(user: User | null, page: string, source: string | null) {
	// Get client IP address
	const headersList = headers();
	const rawIP = headersList.get("x-forwarded-for")?.split(",")[0].trim() || headersList.get("x-real-ip") || "";
	const ip = normalizeIP(rawIP);

	let userDetails;
	const sourceTexts = {
		emailNewTask: " from New Task email",
		emailTaskDueSoon: " from Task Due Soon email",
		emailTaskOverdue: " from Task Overdue email",
		emailTaskCompleted: " from Task Ready for Review email",
		emailCommentMention: " from Comment Mention email",
		emailTaskReopened: " from Task Reopened email",
	};
	const sourceText = !source ? null : sourceTexts[source as keyof typeof sourceTexts];

	if (!user) {
		logger(`A guest visitor accessed ${page} from ${ip} in ${process.env.DEPLOYMENT} deployment${sourceText ? sourceText : ""}.`);
		return;
	}

	userDetails = await getUserDetails(user.id);
	logger(`${userDetails.firstName} ${userDetails.lastName} accessed ${page} from ${ip} in ${process.env.DEPLOYMENT} deployment${sourceText ? sourceText : ""}.`);
}

// Simple logger function to log to console and file
export function logger(message: string) {
	console.log(message);
	log(message, `${process.env.LOGS_PATH}/${logDate()}`);
}
