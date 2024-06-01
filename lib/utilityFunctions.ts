import { Task } from "@prisma/client";
import { differenceInCalendarDays, format, isPast, isToday } from "date-fns";
import sharp from "sharp";

export function formatDate(date: Date) {
	return format(date, "dd MMM yyyy");
}

// Return yellow text color if task is within 10 days of today or red if past due
export function dueColor(task: Task) {
	if (isPast(task.dueDate) || isToday(task.dueDate)) return "text-red-600 dark:text-red-400";
	if (task.statusId === 1 && differenceInCalendarDays(task.dueDate, new Date()) <= 10) return "text-orange-600 dark:text-orange-400";
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
