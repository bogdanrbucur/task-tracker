"use client";
import { KeySquare } from "lucide-react";
import { useEffect } from "react";
import { useFormState } from "react-dom";
import { toast, Toaster } from "sonner";
import { Button } from "../../../../components/ui/button";
import passResetToken from "../_actions/passResetToken";

const initialState = {
	message: null,
	emailSent: undefined,
};

export default function ResetPasswordButton({ userId }: { userId: string }) {
	const [formState, formAction] = useFormState(passResetToken, initialState);

	// Watch if the email was queued and show a toast
	useEffect(() => {
		if (formState?.queued && formState?.emailId) {
			toast.info("Sending password reset email...");
			localStorage.setItem("emailId", formState.emailId); // Save the email id in local storage to check the status in EmailChecker.tsx
		}
		if (formState?.queued === false) toast.error("Failed to send password reset email.");
	}, [formState]);

	return (
		<form action={formAction}>
			<Toaster richColors />
			<Button type="submit" size="sm" className="gap-1">
				Reset Password
				<KeySquare size="18" />
			</Button>
			<input type="hidden" name="id" value={userId} />
		</form>
	);
}
