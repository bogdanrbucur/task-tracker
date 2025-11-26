// layout file for authenticated pages

import { getAuth } from "@/actions/auth/get-auth";
import { redirect } from "next/navigation";

export const metadata = {
	robots: {
		index: false, // Prevent indexing
		follow: false, // Prevent following links
	},
};

export default async function AuthenticatedLayout({ children }: Readonly<{ children: React.ReactNode }>) {
	const { user } = await getAuth();
	if (!user) redirect("/sign-in");

	return <>{children}</>;
}
