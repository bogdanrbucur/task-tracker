// server function to add new task
"use server";

import { logDate } from "@/lib/utilityFunctions";
import prisma from "@/prisma/client";
import log from "log-to-file";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export default async function editDept(prevState: any, formData: FormData) {
	const rawFormData = Object.fromEntries(formData.entries());
	console.log(rawFormData);

	// Define the Zod schema for the form data
	const schema = z.object({
		id: z.string().optional(),
		deptName: z.string().min(2, { message: "Department name must be at least 2 characters long." }),
	});

	try {
		// Parse the form data using the schema
		// If validation fails, an error will be thrown and caught in the catch block
		const data = schema.parse({
			id: formData.get("id") as string,
			deptName: formData.get("deptName") as string,
		});

		// If the data has an id, update the department
		if (data.id) {
			// Find the dept with the given id
			const dept = await prisma.department.findUnique({
				where: { id: Number(data.id) },
			});
			if (!dept) throw new Error("Department not found.");

			const updatedDept = await prisma.department.update({
				where: { id: Number(data.id) },
				data: {
					name: data.deptName,
				},
			});
			console.log(`Department renamed from ${dept.name} to ${updatedDept.name}`);
			log(`Department renamed from ${dept.name} to ${updatedDept.name}`, `./logs/${logDate()}`);
		} else {
			// Create a new department
			const newDept = await prisma.department.create({
				data: {
					name: data.deptName,
				},
			});
			console.log(`New department created: ${newDept.name}`);
			log(`New department created: ${newDept.name}`, `./logs/${logDate()}`);
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
