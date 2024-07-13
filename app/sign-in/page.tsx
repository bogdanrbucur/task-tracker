import SignInForm from "@/app/_auth/components/SignIn";
import { redirect } from "next/navigation";
import { getAuth } from "../_auth/actions/get-auth";

export default async function SignInPage() {
	// If the user is signed in, redirect to the dashboard
	const { user } = await getAuth();
	if (user) return redirect("/");
	return <SignInForm />;
}
