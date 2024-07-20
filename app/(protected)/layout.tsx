// layout file for authenticated pages

import { getAuth } from "@/actions/auth/get-auth";
import { redirect } from "next/navigation";

export default async function AuthenticatedLayout({
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
