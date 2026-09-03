// server function to add new task
"use server";

import { getAuth } from "@/actions/auth/get-auth";
import { getPermissions } from "@/actions/auth/get-permissions";
import logger from "@/lib/logging";
import { lucia } from "@/lib/lucia";
import prisma from "@/prisma/client";
import fs from "fs-extra";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export default async function toggleUser(prevState: any, formData: FormData) {
	// const rawFormData = Object.fromEntries(formData.entries());
	// logger(rawFormData);

	// Check user permissions
	const { user: agent } = await getAuth();
	const userPermissions = await getPermissions(agent?.id);
	if (!userPermissions.isAdmin) return { message: "You do not have permission to perform this action." };

	// Define the Zod schema for the form data
	const schema = z.object({ id: z.string().length(25, { message: "Invalid user ID." }) });

	try {
		// Parse the form data using the schema
		// If validation fails, an error will be thrown and caught in the catch block
		const data = schema.parse({ id: formData.get("id") as string });

		// Find the user with the given email in the database
		const user = await prisma.user.findUnique({
			where: { id: data.id },
			select: { id: true, status: true, subordinates: { select: { id: true, status: true } }, assignedTasks: true, hashedPassword: true },
		});

		if (!user) throw new Error("User not found.");
		// Only active/unverified subordinates block deactivation. Inactive subordinates keep their
		// `managerId` pointing here, so counting them would permanently block a former manager.
		// This matches the UI gate in the user page, which only counts active subordinates.
		const blockingSubordinates = user.subordinates.filter((subordinate) => subordinate.status !== "inactive");
		if (blockingSubordinates.length > 0) throw new Error("User has active subordinates.");

		// Check if the user has assigned tasks and they are either In Progress, Pending Review or Overdue
		const tasksInProgress = user.assignedTasks.filter((task) => task.statusId === 1);
		const tasksPendingReview = user.assignedTasks.filter((task) => task.statusId === 2);
		const tasksOverdue = user.assignedTasks.filter((task) => task.statusId === 5);
		if (tasksInProgress.length > 0 || tasksPendingReview.length > 0 || tasksOverdue.length > 0) throw new Error("User has assigned tasks.");

		const updatedUser = await prisma.user.update({
			where: { id: data.id },
			data: {
				status: user.status === "inactive" && user.hashedPassword ? "active" : user.status === "inactive" && !user.hashedPassword ? "unverified" : "inactive",
				active: user.status === "inactive" && user.hashedPassword ? true : user.status === "inactive" && !user.hashedPassword ? false : false,
			},
		});
		if (updatedUser.status === "active") logger(`User ${updatedUser.email} activated.`);
		else {
			// Nothing re-checks `active` once a session exists, so without this a deactivated user
			// keeps full access until their session happens to expire
			await lucia.invalidateUserSessions(updatedUser.id);

			// Detach from the org hierarchy: unlink any remaining (inactive) subordinates and clear
			// this user's own manager, so stale `managerId` links don't permanently block the
			// deactivation of this user or of their former manager.
			await prisma.user.updateMany({ where: { managerId: data.id }, data: { managerId: null } });
			await prisma.user.update({ where: { id: data.id }, data: { managerId: null } });

			// Delete the user's avatar
			await prisma.avatar.deleteMany({ where: { userId: data.id } });

			// Check if the avatar file exists before deleting it
			if (fs.existsSync(`${process.env.FILES_PATH}/avatars/${data.id}.jpg`))
				// Delete the user's avatar file
				fs.unlinkSync(`${process.env.FILES_PATH}/avatars/${data.id}.jpg`);
			logger(`User ${updatedUser.email} deactivated. Avatar deleted.`);
		}
	} catch (error) {
		// Handle Zod validation errors - return the message attribute back to the client
		if (error instanceof z.ZodError) for (const subError of error.errors) return { message: subError.message };
		// Handle other errors
		else return { message: (error as any).message };
	}
	// refresh the page
	revalidatePath(`/users/${formData.get("id")}`);
}
