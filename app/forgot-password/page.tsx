import { isPasswordAuthEnabled } from "@/lib/auth-flags";
import { notFound } from "next/navigation";
import ForgotPasswordForm from "./_components/ForgotPasswordForm";

export default async function ForgotPasswordPage() {
	// Password sign-in itself is off, so there is nothing this page can do for anyone.
	if (!isPasswordAuthEnabled()) return notFound();

	return <ForgotPasswordForm />;
}
