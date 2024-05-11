// server function to add new task
"use server";

import { formatDate } from "@/lib/utilityFunctions";
import prisma from "@/prisma/client";
import { redirect } from "next/navigation";
import { z } from "zod";

export default async function submitTask(prevState: any, formData: FormData) {
	const formRawData = Object.fromEntries(formData.entries());
	console.log(formRawData);

	// Define the Zod schema for the form data
	const schema = z.object({
		title: z.string().min(10, { message: "Title must be at least 10 characters." }).max(100, { message: "Title must be at most 100 characters." }),
		description: z.string().min(20, { message: "Description must be at least 20 characters." }).max(500, { message: "Description must be at most 500 characters." }),
		dueDate: z.string().datetime({ message: "Due date is required." }),
		userId: z.string().length(15, { message: "Assigned user is required." }),
		createdByUserId: z.string().length(15),
	});

	let newTask;
	try {
		// Parse the form data using the schema
		// If validation fails, an error will be thrown and caught in the catch block
		const data = schema.parse({
			title: formData.get("title") as string,
			description: formData.get("description") as string,
			dueDate: formData.get("dueDate") as string,
			userId: formData.get("assignedToUserId") as string,
			createdByUserId: formData.get("createdByUserId") as string,
		});
		console.log(data);

		// Get the created by user object by the ID
		const createdByUser = await prisma.user.findUnique({
			where: { id: data.createdByUserId },
			select: { firstName: true, lastName: true },
		});

		// Create a new task in the database
		newTask = await prisma.task.create({
			data: {
				title: data.title,
				description: data.description,
				dueDate: new Date(data.dueDate),
				assignedToUserId: data.userId,
				createdByUserId: data.createdByUserId,
			},
			include: { assignedToUser: true },
		});

		if (newTask) {
			console.log("Task created successfully");
			// Add the changes to the task
			const newChange = await prisma.change.create({
				data: {
					taskId: newTask.id,
					userId: data.createdByUserId,
					time: new Date(),
					changes: `Task created by ${createdByUser?.firstName} ${createdByUser?.lastName ? createdByUser?.lastName : ""} and assigned to ${
						newTask.assignedToUser?.firstName
					} ${newTask.assignedToUser?.lastName ? newTask.assignedToUser?.lastName : ""} on ${formatDate(newTask.createdAt)}`,
				},
			});

			console.log(newChange);
		}

		console.log(newTask);
	} catch (error) {
		// Handle Zod validation errors
		if (error instanceof z.ZodError) {
			for (const subError of error.errors) {
				return { message: subError.message };
			}
		} else {
			// Handle other errors
			return { message: (error as any).message };
		}
	}
	redirect(`/tasks/${newTask?.id ? newTask.id : ""}`);
}
