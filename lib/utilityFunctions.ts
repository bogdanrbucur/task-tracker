import { differenceInCalendarDays, format, isPast, isToday } from "date-fns";
import sharp from "sharp";

export function formatDate(date: Date) {
	return format(date, "dd MMM yyyy");
}

// Return yellow text color if task is within 10 days of today or red if past due
export function dueColor(date: Date) {
	if (isPast(date) || isToday(date)) return "text-red-600 dark:text-red-400";
	if (differenceInCalendarDays(date, new Date()) <= 10) return "text-orange-600 dark:text-orange-400";
	return "";
}

// Return red if completed past due date
export function completedColor(completedDate: Date, dueDate: Date) {
	if (dueDate < completedDate) return "text-red-600 dark:text-red-400";
	return "";
}

export async function resizeAndSaveImage(avatarBuffer: Buffer, filePath: string) {
	sharp(avatarBuffer).resize(256, 256).withMetadata().toFile(filePath);
}
