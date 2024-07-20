// server function to add new task
"use server";

import prisma from "@/prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import fs from "fs-extra";

export default async function toggleUser(prevState: any, formData: FormData) {
	// const rawFormData = Object.fromEntries(formData.entries());
	// console.log(rawFormData);

	// Define the Zod schema for the form data
	const schema = z.object({
		id: z.string().length(25, { message: "Invalid user ID." }),
	});

	try {
		// Parse the form data using the schema
		// If validation fails, an error will be thrown and caught in the catch block
		const data = schema.parse({
			id: formData.get("id") as string,
		});

		// Find the user with the given email in the database
		const user = await prisma.user.findUnique({
			where: { id: data.id },
			select: { id: true, status: true, subordinates: true, assignedTasks: true, hashedPassword: true },
		});
		if (!user) throw new Error("User not found.");
		if (user.subordinates.length > 0) throw new Error("User has subordinates.");
		if (user.assignedTasks.length > 0) throw new Error("User has assigned tasks.");

		const updatedUser = await prisma.user.update({
			where: { id: data.id },
			data: {
				status: user.status === "inactive" && user.hashedPassword ? "active" : user.status === "inactive" && !user.hashedPassword ? "unverified" : "inactive",
				active: user.status === "inactive" && user.hashedPassword ? true : user.status === "inactive" && !user.hashedPassword ? false : false,
			},
		});
		if (updatedUser.status === "active") {
			console.log("User activated.");
		} else {
			// Delete the user's avatar
			await prisma.avatar.deleteMany({
				where: { userId: data.id },
			});
			// Check if the avatar file exists before deleting it
			if (fs.existsSync(`avatars/${data.id}.jpg`)) {
				fs.unlinkSync(`avatars/${data.id}.jpg`);
			}
			// Delete the user's avatar file
			console.log("User deactivated. Avatar deleted.");
		}
	} catch (error) {
		// Handle Zod validation errors - return the message attribute back to the client
		if (error instanceof z.ZodError) {
			for (const subError of error.errors) {
				return { message: subError.message };
			}
		} else {
			// Handle other errors
			return { message: (error as any).message };
		}
	}
	// refresh the page
	revalidatePath(`/users/${formData.get("id")}`);
}
