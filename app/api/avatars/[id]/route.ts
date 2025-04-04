import fs from "fs-extra";
import { notFound } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
	// search for any file in the avatars folder that matches the id
	const files = await fs.readdir(`${process.env.FILES_PATH}/avatars`);
	const filename = files.find((file) => file.includes(params.id));
	if (!filename) return notFound();

	// Read the file
	const file = await fs.readFile(`${process.env.FILES_PATH}/avatars/${filename}`);
	// Return the file as a response
	return new NextResponse(file, {
		headers: {
			"Content-Type": "image",
		},
	});
}
