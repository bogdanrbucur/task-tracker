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
import prisma from "@/prisma/client";

export type NewUser = {
	firstName: string;
	lastName: string;
	email: string;
	position: string;
	departmentId: string;
	managerId: string | null;
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
		email: z.string().email({ message: "Invalid email address." }).nullable(),
		position: z.string().min(3, { message: "Position must be at least 2 characters long." }).nullable(),
		departmentId: z.string({ message: "Invalid department." }).max(3, { message: "Invalid department." }).min(1, { message: "Invalid department." }),
		managerId: z.string().nullable(),
		editor: z.string().length(25, { message: "Invalid editor." }),
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
			isAdmin: formData.get("isAdmin"),
			avatar: formData.get("avatar") as File | null,
			// avatarBuffer: undefined as Buffer | undefined,
		});

		// If the user edited themselves, they cannot change their email or position
		// The client will not send them to the server, so need to fill them in here
		if (data.id === data.editor) {
			// Fetch the user details
			const user = await getUserDetails(data.id);
			data.email = user.email;
			data.position = user.position;
			data.isAdmin = user.isAdmin ? "on" : null;
		}

		// Check the size of the avatar and reject if it's too large
		if (data.avatar && data.avatar.size > 4194304) {
			return { message: "Avatar file is too large. Maximum size is 4 MB." };
		}

		// Get the created by user object by the ID
		const editingUser = await getUserDetails(data.editor);

		// TODO clean-up... this is a mess
		// If a user ID is provided, update the existing user
		if (data.id) {
			newUser = await updateUser(data as UpdateUser, editingUser!);
		}
		// If no user ID is provided, create a new user
		else {
			const { newUser: tempUsr, emailStatus, error } = await createUser(data as NewUser, editingUser);
			if (error instanceof Error) throw new Error(error.message);
			newUser = tempUsr ?? null;
		}

		// Save the avatar locally
		if (newUser && data.avatar && data.avatar?.size > 0) {
			const avatar = formData.get("avatar") as File;
			const arrayBuffer = await avatar.arrayBuffer();
			const avatarBuffer = Buffer.from(arrayBuffer);
			// const extension = avatar.name.split(".").pop();
			const fileName = `${newUser.id}.jpg`;
			// data.avatarPath = fileName;
			try {
				// First delete the existing avatar if it exists
				// search for any file in the avatars folder that matches the id
				const avatars = await fs.readdir("./avatars");
				const oldAvatar = avatars.find((file) => file.includes(String(newUser!.id)));
				if (oldAvatar) await fs.remove(`./avatars/${oldAvatar}`);

				// Resize and save the avatar
				await resizeAndSaveImage(avatarBuffer, `./avatars/${fileName}`);

				console.log(`Avatar saved to ./avatars/${fileName}`);

				// Update the user with the new avatar path
				const newAvatar = await prisma.avatar.create({
					data: {
						userId: newUser.id,
						path: fileName,
					},
				});
			} catch (error) {
				console.log(error);
			}
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
	revalidatePath(`/users${formData.get("id") ? `/${formData.get("id")}` : ""}`);
	redirect(newUser ? `/users/${String(newUser.id)}` : `/users/${formData.get("id")}`);
}
