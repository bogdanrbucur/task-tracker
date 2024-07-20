// Wrapper for protected routes
// API routes can be kept in (protected) pages/api

import { getAuth } from "@/actions/auth/get-auth";
import { redirect } from "next/navigation";

export default async function ProtectedWrapper({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const { user } = await getAuth();

	if (!user) {
		redirect("/sign-in");
	}

	return <>{children}</>;
}
