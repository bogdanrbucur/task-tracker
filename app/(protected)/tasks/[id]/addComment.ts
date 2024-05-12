// server function to add new comment
"use server";
import prisma from "@/prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export default async function addComment(prevState: any, formData: FormData) {
	// Define the Zod schema for the form data
	const schema = z.object({
		taskId: z.string(),
		userId: z.string().length(15, { message: "User not provided." }),
		comment: z.string().min(2, { message: "Comment must be at least 2 characters." }),
	});

	try {
		// Parse the form data using the schema
		// If validation fails, an error will be thrown and caught in the catch block
		const data = schema.parse({
			taskId: formData.get("taskId") as string,
			userId: formData.get("userId") as string,
			comment: formData.get("comment") as string,
		});

		const newComment = await prisma.comment.create({
			data: {
				taskId: Number(data.taskId),
				userId: data.userId,
				time: new Date(),
				comment: data.comment,
			},
		});

		// console.log("New comment added: ", newComment);
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
	revalidatePath(`/tasks/${formData.get("taskId")}`);
}
