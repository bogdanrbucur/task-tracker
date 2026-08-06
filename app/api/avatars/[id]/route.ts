import { getAuth } from "@/actions/auth/get-auth";
import fs from "fs-extra";
import { notFound } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";
import path from "path";

export async function GET(req: NextRequest, context: any) {
	// Support both typed and promise-style params (some Next.js types use Promise<{...}>)
	const resolvedParams = (await context.params) || context.params;
	const params = resolvedParams as { id: string };

	// Avatars are personal data - this route used to be the only one serving files with no session
	// check at all
	const { user } = await getAuth();
	if (!user) return notFound();

	const { id } = await params;

	// Match on the exact stored filename rather than a substring: `includes` meant an id of "."
	// returned whichever file happened to sort first
	const avatarsDir = `${process.env.FILES_PATH}/avatars`;
	// readdir throws on a missing directory, which would surface as a 500 before any avatar exists
	if (!(await fs.pathExists(avatarsDir))) return notFound();
	const files = await fs.readdir(avatarsDir);
	const filename = files.find((file) => path.parse(file).name === id);
	if (!filename) return notFound();

	// Read the file
	const file = await fs.readFile(`${avatarsDir}/${filename}`);
	// Return the file as a response
	return new NextResponse(new Uint8Array(file), {
		headers: {
			"Content-Type": "image/jpeg",
			"X-Content-Type-Options": "nosniff",
		},
	});
}
