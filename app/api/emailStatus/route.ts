// This route checks the emailQueue table for a given email ID status
import prisma from "@/prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/actions/auth/get-auth";
import { notFound } from "next/navigation";

export async function GET(req: NextRequest) {
	const { user } = await getAuth();
	if (!user) return notFound();

	const { searchParams } = new URL(req.url);
	const emailId = searchParams.get("id");
	if (!emailId) {
		return NextResponse.json({ success: false, error: "Email ID not provided." }, { status: 400 });
	}

	try {
		const emailRecord = await prisma.emailOutbox.findUnique({
			where: { id: emailId },
		});

		if (!emailRecord) {
			return NextResponse.json({ success: false, error: "Email not found." }, { status: 404 });
		}

		return NextResponse.json({ success: true, status: emailRecord.status, error: null });
	} catch (error) {
		return NextResponse.json({ success: false, error: "Database error." }, { status: 500 });
	}
}
