import prisma from "@/prisma/client";
import ResetPassword from "./_components/ResetPassword";
import { notFound } from "next/navigation";

export default async function PasswordResetPage({ searchParams }: { searchParams: { token: string } }) {
	console.log("Password reset token: ", searchParams.token);

	// No token, no page
	if (!searchParams.token) return notFound();

	// Get the token from the database
	const dbToken = await prisma.passwordResetToken.findUnique({
		where: { token: searchParams.token },
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

	return <ResetPassword userId={user!.id} firstName={user!.firstName} />;
}
