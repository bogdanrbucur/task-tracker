import { getAuth } from "@/actions/auth/get-auth";
import { redirect } from "next/navigation";
import SignInForm from "./_components/SignIn";

export default async function SignInPage() {
	// If the user is signed in, redirect to the dashboard
	const { user } = await getAuth();
	if (user) return redirect("/");
	return <SignInForm />;
}
