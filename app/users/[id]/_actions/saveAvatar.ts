import logger from "@/lib/logging";
import { resizeAndSaveImage } from "@/lib/utilityFunctions";
import prisma from "@/prisma/client";
import { User } from "@prisma/client";
import fs from "fs-extra";
import path from "path";

export default async function saveAvatar(avatar: File, newUser: User) {
	const arrayBuffer = await avatar.arrayBuffer();
	const avatarBuffer = Buffer.from(arrayBuffer);
	const fileName = `${newUser.id}.jpg`;

	try {
		// Create the folder if it is not there yet - readdir on a missing directory throws, and the
		// catch below would swallow it, silently dropping the very first avatar uploaded to a
		// fresh deployment
		const avatarsDir = `${process.env.FILES_PATH}/avatars`;
		await fs.ensureDir(avatarsDir);

		// First delete the existing avatar if it exists
		// search for any file in the avatars folder that matches the id
		const avatars = await fs.readdir(avatarsDir);
		// Exact stem match, not a substring - see the matching change in /api/avatars/[id]
		const oldAvatar = avatars.find((file) => path.parse(file).name === newUser.id);
		if (oldAvatar) await fs.remove(`${process.env.FILES_PATH}/avatars/${oldAvatar}`);

		// Resize and save the avatar
		await resizeAndSaveImage(avatarBuffer, `${process.env.FILES_PATH}/avatars/${fileName}`);

		logger(`Avatar saved to ${process.env.FILES_PATH}/avatars/${fileName}`);

		// Update the user with the new avatar path
		if (!oldAvatar) {
			const newAvatar = await prisma.avatar.create({
				data: {
					userId: newUser.id,
					path: fileName,
				},
			});
		}
	} catch (error: any) {
		logger(error?.message ? error.message : "Error saving avatar");
	}
}
