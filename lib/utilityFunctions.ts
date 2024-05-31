import { differenceInCalendarDays, format, isPast, isToday } from "date-fns";
import Jimp from "jimp";

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
	const image = await Jimp.read(avatarBuffer);
	// Get the smallest dimension and crop the image to that dimension
	const width = image.getWidth();
	const height = image.getHeight();
	const minDimension = Math.min(width, height);
	const x = (width - minDimension) / 2;
	const y = (height - minDimension) / 2;
	await image.crop(x, y, minDimension, minDimension);
	await image.resize(256, 256);
	await image.quality(90);
	await image.grayscale();
	// await image.rotate(90);
	await image.writeAsync(filePath);
}
