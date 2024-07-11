// server function to add new task
"use server";

import createUser from "@/app/users/createUser";
import getUserDetails from "@/app/users/getUserById";
import { resizeAndSaveImage } from "@/lib/utilityFunctions";
import { User } from "@prisma/client";
import fs from "fs-extra";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import updateUser from "../[id]/updateUser";

export type NewUser = {
	firstName: string;
	lastName: string;
	email: string;
	position: string;
	departmentId: string;
	managerId: string | null;
	password: string | null;
	isAdmin?: string | null;
	avatar: Avatar | null;
	avatarPath?: string | null;
};

const Avatar = z.object({
	size: z.number(),
	type: z.string(),
	name: z.string(),
	lastModified: z.number(),
});

type Avatar = z.infer<typeof Avatar>;

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
		departmentId: z.string({ message: "Invalid department." }).max(3, { message: "Invalid department." }).min(1, { message: "Invalid department." }),
		managerId: z.string().nullable(),
		editor: z.string().length(25, { message: "Invalid editor." }),
		password: z.string().min(6, { message: "Password must be at least 6 characters long." }).nullable(),
		confirmPassword: z.string().min(6, { message: "Password must be at least 6 characters long." }).nullable(),
		isAdmin: z.string().nullable(),
		avatar: Avatar.nullable(),
		avatarPath: z.string().optional(),
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
			confirmPassword: formData.get("confirmPassword") as string,
			isAdmin: formData.get("isAdmin"),
			avatar: formData.get("avatar") as File | null,
			// avatarBuffer: undefined as Buffer | undefined,
		});

		if (data.password !== data.confirmPassword) {
			return { message: "Passwords do not match." };
		}

		// Check the size of the avatar and reject if it's too large
		if (data.avatar && data.avatar.size > 4194304) {
			return { message: "Avatar file is too large. Maximum size is 4 MB." };
		}

		// Save the avatar locally
		if (data.avatar && data.avatar?.size > 0) {
			const avatar = formData.get("avatar") as File;
			const arrayBuffer = await avatar.arrayBuffer();
			const avatarBuffer = Buffer.from(arrayBuffer);
			// const extension = avatar.name.split(".").pop();
			const fileName = `${data.id}.jpg`;
			data.avatarPath = fileName;
			try {
				// First delete the existing avatar if it exists
				// search for any file in the avatars folder that matches the id
				const avatars = await fs.readdir("./avatars");
				const oldAvatar = avatars.find((file) => file.includes(String(data.id)));
				if (oldAvatar) await fs.remove(`./avatars/${oldAvatar}`);

				// Resize and save the avatar
				await resizeAndSaveImage(avatarBuffer, `./avatars/${fileName}`);

				console.log(`Avatar saved to ./avatars/${fileName}`);
			} catch (error) {
				console.log(error);
			}
		}

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
	revalidatePath(`/users${formData.get("id") ? `/${formData.get("id")}` : ""}`);
	redirect(newUser ? `/users/${String(newUser.id)}` : `/users/${formData.get("id")}`);
}
