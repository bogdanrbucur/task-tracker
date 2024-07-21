// server function to add new task
"use server";

import { logDate } from "@/lib/utilityFunctions";
import prisma from "@/prisma/client";
import log from "log-to-file";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export default async function deleteDept(prevState: any, formData: FormData) {
	const rawFormData = Object.fromEntries(formData.entries());
	console.log(rawFormData);

	// Define the Zod schema for the form data
	const schema = z.object({
		id: z.string(),
	});

	try {
		// Parse the form data using the schema
		// If validation fails, an error will be thrown and caught in the catch block
		const data = schema.parse({
			id: formData.get("id") as string,
		});

		// If the data has an id, update the department
		if (data.id) {
			// Find the dept with the given id
			const dept = await prisma.department.findUnique({
				where: { id: Number(data.id) },
			});
			if (!dept) throw new Error("Department not found.");

			// Check if the department has any employees
			const employees = await prisma.user.findMany({
				where: { departmentId: Number(data.id) },
			});

			if (employees.length > 0) {
				return { message: "Unable to delete department. Users are assigned to it." };
			}
			// If not, delete
			await prisma.department.delete({
				where: { id: Number(data.id) },
			});
			console.log(`Department ${dept.name} deleted`);
			log(`Department ${dept.name} deleted`, `./logs/${logDate()}`);
		}
		return { dialogOpen: false, success: true };
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
	revalidatePath(`/departments`);
}
