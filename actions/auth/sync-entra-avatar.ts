// Pulls a user's profile photo from Microsoft Entra (Graph) and stores it as their avatar.
//
// Deliberately NOT a "use server" module - like link-m365.ts, this must not become a callable
// endpoint. It is imported by the OAuth callback route handler only, and runs once per M365
// sign-in: the sign-in itself is the refresh trigger, so there is no background job.
//
// Contract:
//   - Graph returns a photo  -> overwrite <userId>.jpg and upsert the Avatar row.
//   - Graph 404 (no photo set, or an unlicensed / on-prem mailbox) -> delete the file and the
//     Avatar row, so the UI falls back to the initials placeholder.
//   - Anything else (5xx, network error, expired token) -> log and change nothing; the next
//     sign-in retries.
// This never throws: a Graph or disk hiccup must not break sign-in.

import logger from "@/lib/logging";
import { resizeAndSaveImage } from "@/lib/utilityFunctions";
import prisma from "@/prisma/client";
import fs from "fs-extra";

// 360x360 is the smallest standard Entra photo size at or above the 256x256 that
// resizeAndSaveImage produces - keeps the download and the resize input small.
const GRAPH_PHOTO_URL = "https://graph.microsoft.com/v1.0/me/photos/360x360/$value";

function avatarPathFor(userId: string) {
	return `${process.env.FILES_PATH}/avatars/${userId}.jpg`;
}

async function removeAvatar(userId: string) {
	await prisma.avatar.deleteMany({ where: { userId } });
	const file = avatarPathFor(userId);
	if (await fs.pathExists(file)) await fs.remove(file);
}

export async function syncEntraAvatar(userId: string, accessToken: string): Promise<void> {
	try {
		const res = await fetch(GRAPH_PHOTO_URL, {
			headers: { Authorization: `Bearer ${accessToken}` },
		});

		if (res.status === 404) {
			// No photo in Entra - make sure we are not showing a stale one.
			await removeAvatar(userId);
			logger(`Entra has no photo for user ${userId}; avatar reverted to initials`);
			return;
		}

		if (!res.ok) {
			// Transient - leave whatever avatar exists untouched and try again next sign-in.
			logger(`Entra avatar sync skipped for user ${userId}: Graph returned ${res.status}`);
			return;
		}

		const buffer = Buffer.from(await res.arrayBuffer());
		const avatarsDir = `${process.env.FILES_PATH}/avatars`;
		await fs.ensureDir(avatarsDir);
		await resizeAndSaveImage(buffer, avatarPathFor(userId));

		// upsert, not create: saveAvatar.ts only creates the row when no file existed, so a user
		// whose file is present but row is missing (or vice versa) would otherwise never converge.
		await prisma.avatar.upsert({
			where: { userId },
			create: { userId, path: `${userId}.jpg` },
			update: { path: `${userId}.jpg` },
		});

		logger(`Entra avatar synced for user ${userId}`);
	} catch (error) {
		logger(`Entra avatar sync failed for user ${userId}: ${error instanceof Error ? error.message : String(error)}`);
	}
}
