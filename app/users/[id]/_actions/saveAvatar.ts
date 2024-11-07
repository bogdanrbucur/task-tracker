import { resizeAndSaveImage } from "@/lib/utilityFunctions";
import prisma from "@/prisma/client";
import { User } from "@prisma/client";
import fs from "fs-extra";

export default async function saveAvatar(avatar: File, newUser: User) {
			const arrayBuffer = await avatar.arrayBuffer();
			const avatarBuffer = Buffer.from(arrayBuffer);
			// const extension = avatar.name.split(".").pop();
			const fileName = `${newUser.id}.jpg`;
			// data.avatarPath = fileName;
			try {
				// First delete the existing avatar if it exists
				// search for any file in the avatars folder that matches the id
				const avatars = await fs.readdir(`${process.env.FILES_PATH}/avatars`);
				const oldAvatar = avatars.find((file) => file.includes(String(newUser!.id)));
				if (oldAvatar) await fs.remove(`${process.env.FILES_PATH}/avatars/${oldAvatar}`);

				// Resize and save the avatar
				await resizeAndSaveImage(avatarBuffer, `${process.env.FILES_PATH}/avatars/${fileName}`);

				console.log(`Avatar saved to ${process.env.FILES_PATH}/avatars/${fileName}`);

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