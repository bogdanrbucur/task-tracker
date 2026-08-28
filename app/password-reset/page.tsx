import { isPasswordAuthEnabled } from "@/lib/auth-flags";
import prisma from "@/prisma/client";
import ResetPassword from "./_components/ResetPassword";
import { notFound } from "next/navigation";

export default async function PasswordResetPage({ searchParams }: { searchParams: { token: string } }) {
	// Password sign-in itself is off - a link from before it was turned off (or from an admin's
	// resend) must not still work.
	if (!isPasswordAuthEnabled()) return notFound();

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

	// If the token is expired, or the account is now linked to Microsoft 365, delete it and 404 -
	// same outcome as an expired token, so this page can't be used to discover which accounts are
	// linked.
	if (dbToken.expiresAt < new Date() || !user || user.entraOid) {
		await prisma.passwordResetToken.delete({
			where: { id: dbToken.id },
		});
		return notFound();
	}

	// The token, not the user id, is what the action authenticates against
	return <ResetPassword token={token} firstName={user!.firstName} />;
}
