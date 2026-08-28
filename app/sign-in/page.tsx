import { getAuth } from "@/actions/auth/get-auth";
import { isPasswordAuthEnabled } from "@/lib/auth-flags";
import { isM365Enabled, m365ErrorMessages, type M365ErrorCode } from "@/lib/m365";
import { redirect } from "next/navigation";
import SignInForm from "./_components/SignIn";

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
	// If the user is signed in, redirect to the dashboard
	const { user } = await getAuth();
	if (user) return redirect("/");

	// The M365 callback reports failures as a fixed set of codes. Map them here so nothing from the
	// OAuth response is ever reflected back into the page.
	const { error } = await searchParams;
	const initialMessage = error && error in m365ErrorMessages ? m365ErrorMessages[error as M365ErrorCode] : null;

	return <SignInForm m365Enabled={isM365Enabled()} passwordEnabled={isPasswordAuthEnabled()} initialMessage={initialMessage} />;
}
