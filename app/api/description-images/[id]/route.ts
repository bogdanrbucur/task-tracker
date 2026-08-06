// GET route to serve an inline description image.
// Auth-gated only, with no per-task check - this matches /api/attachments/[id],
// since any signed-in user can already view any task.

import { getAuth } from "@/actions/auth/get-auth";
import { descriptionImagesDir } from "@/lib/richText.server";
import prisma from "@/prisma/client";
import fs from "fs-extra";
import { notFound } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";

// Params are a Promise in Next.js 15+; accept either shape, as /api/attachments/[id] does
export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> | { id: string } }) {
	const { id } = await context.params;

	const { user } = await getAuth();
	if (!user) return notFound();

	const image = await prisma.descriptionImage.findUnique({ where: { id } });
	if (!image) return notFound();

	const filePath = `${descriptionImagesDir()}/${image.path}`;
	if (!(await fs.pathExists(filePath))) return notFound();

	const fileContent = await fs.readFile(filePath);

	return new NextResponse(new Uint8Array(fileContent), {
		headers: {
			"Content-Type": "image/webp",
			"Content-Disposition": "inline",
			// Ids are immutable, so the bytes behind one never change
			"Cache-Control": "private, max-age=31536000, immutable",
		},
	});
}
