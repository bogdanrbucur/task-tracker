// POST route to upload an image embedded inline in a task description.
// The upload is not tied to a task yet - the returned row has a null taskId and is
// claimed by reconcileDescriptionImages() when the task is created or updated.

import { getAuth } from "@/actions/auth/get-auth";
import { DESCRIPTION_IMAGE_MAX_DIMENSION, MAX_DESCRIPTION_IMAGE_SIZE_BYTES, MAX_DESCRIPTION_IMAGE_SIZE_MB, descriptionImageUrl } from "@/lib/richText";
import { descriptionImagesDir } from "@/lib/richText.server";
import logger from "@/lib/logging";
import prisma from "@/prisma/client";
import { randomUUID } from "crypto";
import fs from "fs-extra";
import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

export async function POST(req: NextRequest) {
	const { user } = await getAuth();
	if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	const form = await req.formData();
	const file = form.get("file");

	if (!(file instanceof File)) return NextResponse.json({ error: "No file provided" }, { status: 400 });
	if (!file.type.startsWith("image/")) return NextResponse.json({ error: "Only images can be embedded in a description" }, { status: 400 });
	if (file.size > MAX_DESCRIPTION_IMAGE_SIZE_BYTES) return NextResponse.json({ error: `Image must not exceed ${MAX_DESCRIPTION_IMAGE_SIZE_MB} MB` }, { status: 400 });

	try {
		const inputBuffer = Buffer.from(await file.arrayBuffer());

		// Always re-encode to WebP. This normalises the size and means we never store or
		// serve the original bytes, which removes the SVG-as-script vector entirely.
		const { data, info } = await sharp(inputBuffer)
			.rotate() // honour EXIF orientation before we strip metadata
			.resize({ width: DESCRIPTION_IMAGE_MAX_DIMENSION, height: DESCRIPTION_IMAGE_MAX_DIMENSION, fit: "inside", withoutEnlargement: true })
			.webp({ quality: 82 })
			.toBuffer({ resolveWithObject: true });

		const id = randomUUID();
		const path = `${id}.webp`;

		await fs.ensureDir(descriptionImagesDir());
		await fs.writeFile(`${descriptionImagesDir()}/${path}`, new Uint8Array(data));

		await prisma.descriptionImage.create({
			data: { id, taskId: null, path, width: info.width, height: info.height, createdBy: user.id },
		});

		logger(`Description image ${path} uploaded by ${user.id}`);

		return NextResponse.json({ id, url: descriptionImageUrl(id), width: info.width, height: info.height });
	} catch (error) {
		logger(`Error saving description image: ${error instanceof Error ? error.message : error}`);
		return NextResponse.json({ error: "Could not process that image" }, { status: 400 });
	}
}
