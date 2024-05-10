// server function to add new task

"use server";

import prisma from "@/prisma/client";
import { redirect } from "next/navigation";

export default async function submitTask(formData: FormData) {
	const formDataRaw = {
		title: formData.get("title") as string,
		description: formData.get("description") as string,
		dueDate: formData.get("dueDate") as string,
		userId: formData.get("assignedToUserId") as string,
	};

	console.log(formDataRaw);

	try {
		// await prisma.user.create({
		// 	data: {
		// 		id: userId,
		// 		firstName: formDataRaw.firstName,
		// 		lastName: formDataRaw.lastName,
		// 		email: formDataRaw.email,
		// 		hashedPassword,
		// 	},
		// });
	} catch (error) {
		// TODO: add error feedback yourself
		// https://www.robinwieruch.de/next-forms/
		// TODO: add error handling if user email is already taken
		// The Road to Next
	}

	redirect("/tasks");
}
