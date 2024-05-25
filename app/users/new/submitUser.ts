// server function to add new task
"use server";

import getUserDetails from "@/app/users/getUserById";
import { Task, User } from "@prisma/client";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createTask } from "../../(protected)/tasks/new/createTask";
import { updateTask } from "../../(protected)/tasks/[id]/updateTask";
import createUser from "@/app/_auth/actions/createUser";
import updateUser from "../[id]/updateUser";

export type NewUser = {
	firstName: string;
	lastName: string;
	email: string;
	position: string;
	departmentId: string;
	managerId: string | null;
	password: string;
	isAdmin?: string | null;
};
export type UpdateUser = NewUser & { id: string };
export type Editor = { firstName: string; lastName: string; id: string };

export default async function submitUser(prevState: any, formData: FormData) {
	const rawFormData = Object.fromEntries(formData.entries());
	console.log(rawFormData);

	// Define the Zod schema for the form data
	const schema = z.object({
		id: z.string().nullable(),
		firstName: z.string().min(2, { message: "First name must be at least 2 characters long." }).max(30, { message: "First name must be at most 30 characters long." }),
		lastName: z.string().min(2, { message: "Last name must be at least 2 characters long." }).max(30, { message: "Last name must be at most 30 characters long." }),
		email: z.string().email({ message: "Invalid email address." }),
		position: z.string().min(3, { message: "Position must be at least 2 characters long." }),
		departmentId: z.string().max(3, { message: "Invalid department." }),
		managerId: z.string().nullable(),
		editor: z.string().length(25, { message: "Invalid editor." }),
		password: z.string().min(6, { message: "Password must be at least 6 characters long." }),
		isAdmin: z.string().nullable(),
	});

	let newUser: User | null = null;
	try {
		// Parse the form data using the schema
		// If validation fails, an error will be thrown and caught in the catch block
		const data = schema.parse({
			id: formData.get("id") as string,
			firstName: formData.get("firstName") as string,
			lastName: formData.get("lastName") as string,
			email: formData.get("email") as string,
			position: formData.get("position") as string,
			departmentId: formData.get("departmentId") as string,
			managerId: formData.get("managerId") as string,
			editor: formData.get("editor") as string,
			password: formData.get("password") as string,
			isAdmin: formData.get("isAdmin"),
		});

		// Get the created by user object by the ID
		const editingUser = await getUserDetails(data.editor);

		// If a user ID is provided, update the existing user
		if (data.id) newUser = await updateUser(data as UpdateUser, editingUser!);
		// If no user ID is provided, create a new user
		else newUser = await createUser(data, editingUser);
		// console.log(newUser);

		// Redirect to the task page, either for the updated task or the new task
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
	redirect(newUser ? `/users/${String(newUser.id)}` : `/users/${formData.get("id")}`);
}
