import { NextRequest, NextResponse } from "next/server";
import fs from "fs-extra";
import { notFound, redirect } from "next/navigation";

export const revalidate = 10;

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
	// search for any file in the avatars folder that matches the id
	const files = await fs.readdir("./avatars");
	const filename = files.find((file) => file.includes(params.id));
	if (!filename) return notFound();

	// Read the file
	const file = await fs.readFile(`./avatars/${filename}`);
	// Return the file as a response
	return new NextResponse(file, {
		headers: {
			"Content-Type": "image",
		},
	});
}
