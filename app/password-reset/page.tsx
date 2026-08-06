import prisma from "@/prisma/client";
import ResetPassword from "./_components/ResetPassword";
import { notFound } from "next/navigation";

export default async function PasswordResetPage({ searchParams }: { searchParams: { token: string } }) {
	// Destructure the token from search params
	const { token } = await searchParams;

	// No token, no page
	if (!token) return notFound();

	// Get the token from the database
	const dbToken = await prisma.passwordResetToken.findUnique({
		where: { token: token },
	});

	// No token, no page
	if (!dbToken) return notFound();

	// Get the user from the database
	const user = await prisma.user.findUnique({
		where: { id: dbToken.userId, status: { in: ["active", "unverified"] } },
	});

	// If the token is expired, delete it and return a 404
	if (dbToken.expiresAt < new Date() || !user) {
		await prisma.passwordResetToken.delete({
			where: { id: dbToken.id },
		});
		return notFound();
	}

	// The token, not the user id, is what the action authenticates against
	return <ResetPassword token={token} firstName={user!.firstName} />;
}
