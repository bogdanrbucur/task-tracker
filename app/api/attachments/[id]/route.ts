import { getAuth } from "@/actions/auth/get-auth";
import fs from "fs-extra";
import { notFound } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
	// search for any file in the avatars folder that matches the id
	const files = await fs.readdir("./attachments");
	const filename = files.find((file) => file.includes(params.id));
	if (!filename) return notFound();

	// Read the file
	const file = await fs.readFile(`./attachments/${filename}`);
	// Return the file as a response
	return new NextResponse(file, {
		headers: {
			"Content-Type": "file",
		},
	});
}
