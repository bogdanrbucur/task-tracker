// server function to add new task
"use server";

import { PERMISSION_DENIED, getActor } from "@/actions/auth/require-auth";
import createUser from "@/app/users/_actions/createUser";
import getUserDetails from "@/app/users/_actions/getUserById";
import logger from "@/lib/logging";
import { User } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import saveAvatar from "../[id]/_actions/saveAvatar";
import updateUser from "../[id]/_actions/updateUser";

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
	// const rawFormData = Object.fromEntries(formData.entries());
	// logger(rawFormData);

	// Check user permissions
	const actor = await getActor();
	if (!actor) return { message: PERMISSION_DENIED };
	const { user: agent, permissions } = actor;

	// Define the Zod schema for the form data.
	// Note there is no "editor" field: the editor is always the session user. Taking it from the
	// form let a caller skip the self-edit clamp below by sending editor !== id, and so grant
	// themselves isAdmin.
	const schema = z.object({
		id: z.string().nullable(),
		firstName: z.string().min(2, { message: "First name must be at least 2 characters long." }).max(30, { message: "First name must be at most 30 characters long." }),
		lastName: z.string().min(2, { message: "Last name must be at least 2 characters long." }).max(30, { message: "Last name must be at most 30 characters long." }),
		email: z.string().email({ message: "Invalid email address." }).nullable(),
		position: z.string().min(3, { message: "Position must be at least 2 characters long." }).nullable(),
		departmentId: z.string({ message: "Invalid department." }).max(3, { message: "Invalid department." }).min(1, { message: "Invalid department." }),
		managerId: z.string().nullable(),
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
			isAdmin: formData.get("isAdmin"),
			avatar: formData.get("avatar") as File | null,
		});

		// Creating a new user is admin-only; editing is admin-only unless you are editing yourself
		if (!data.id) {
			if (!permissions.isAdmin) return { message: PERMISSION_DENIED };
		} else if (!permissions.isAdmin && data.id !== agent.id) {
			return { message: PERMISSION_DENIED };
		}

		// If the user edited themselves, they cannot change their email, position or admin flag.
		// The client will not send them to the server, so need to fill them in here.
		if (data.id === agent.id) {
			// Fetch the user details
			const user = await getUserDetails(data.id);
			data.email = user.email;
			data.position = user.position;
			data.isAdmin = user.isAdmin ? "on" : null;
		}

		// Check the size of the avatar and reject if it's too large
		if (data.avatar && data.avatar.size > 5242880) return { message: "Avatar file is too large. Maximum size is 5 MB." };

		// The editor is the session user - never a form field
		const editingUser = await getUserDetails(agent.id);

		// If a user ID is provided, update the existing user
		if (data.id) {
			const oldUser = await getUserDetails(data.id);
			newUser = await updateUser(data as UpdateUser, editingUser!);

			logger(`User updated: ${newUser.firstName} ${newUser.lastName} / ${newUser.email} by ${editingUser.firstName} ${editingUser.lastName}`);
			logger(
				`OLD USER: ${oldUser.firstName} ${oldUser.lastName} / ${oldUser.email}, dept: ${oldUser.department?.id}, manager: ${oldUser.manager?.id}, admin: ${oldUser.isAdmin}`
			);
			logger(
				`NEW USER: ${newUser.firstName} ${newUser.lastName} / ${newUser.email}, dept: ${newUser.departmentId}, manager: ${newUser.managerId}, admin: ${newUser.isAdmin}`
			);
		}

		// If no user ID is provided, create a new user
		else {
			const { newUser: tempUsr, emailStatus, error } = await createUser(data as NewUser, editingUser);
			if (error instanceof Error) throw new Error(error.message);
			newUser = tempUsr ?? null;

			if (newUser) logger(`New user created: ${newUser.firstName} ${newUser.lastName} / ${newUser.email} by ${editingUser.firstName} ${editingUser.lastName}`);
		}

		// Save the avatar locally. Skip it for Entra-linked users: their photo comes from
		// Microsoft 365 on every sign-in, so an upload here (the form hides the picker, but a
		// forged POST would not) would only be clobbered at their next sign-in.
		if (newUser && !newUser.entraOid && data.avatar && data.avatar?.size > 0) {
			const avatar = formData.get("avatar") as File;
			await saveAvatar(avatar, newUser);
		}
	} catch (error) {
		// Handle Zod validation errors - return the message attribute back to the client
		if (error instanceof z.ZodError) for (const subError of error.errors) return { message: subError.message };
		// Handle other errors
		else return { message: (error as any).message };
	}

	revalidatePath(`/users${formData.get("id") ? `/${formData.get("id")}` : ""}`);
	redirect(newUser ? `/users/${String(newUser.id)}` : `/users/${formData.get("id")}`);
}
