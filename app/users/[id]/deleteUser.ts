// server function to add new task
"use server";

import prisma from "@/prisma/client";
import fs from "fs-extra";
import { redirect } from "next/navigation";
import { z } from "zod";

export default async function deleteUser(prevState: any, formData: FormData) {
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
		if (user.hashedPassword) throw new Error("User was active at some point.");
		if (user.status !== "inactive") throw new Error("User is not inactive.");

		const deletedUser = await prisma.user.delete({
			where: { id: data.id },
		});
		if (deletedUser) {
			// Delete the user's avatar
			await prisma.avatar.deleteMany({
				where: { userId: data.id },
			});
			// Check if the avatar file exists before deleting it
			if (fs.existsSync(`avatars/${data.id}.jpg`)) {
				fs.unlinkSync(`avatars/${data.id}.jpg`);
			}
			// Delete the user's avatar file
			console.log("User deleted. Avatar deleted.");

			// TODO return Sonner...
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
	redirect(`/users`);
}
