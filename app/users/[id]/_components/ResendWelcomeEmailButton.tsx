"use client";
import { Gift } from "lucide-react";
import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "../../../../components/ui/button";
import passResetToken from "../_actions/passResetToken";

const initialState = {
	message: null,
	emailId: undefined,
	queued: undefined,
};

export default function ResendWelcomeEmailButton({ userId }: { userId: string }) {
	const [formState, formAction] = useActionState(passResetToken, initialState);

	// Watch if the email was queued and show a toast
	useEffect(() => {
		if (formState?.queued && formState?.emailId) {
			toast.info("Resending welcome email...");
			localStorage.setItem("emailId", formState.emailId); // Save the email id in local storage to check the status in EmailChecker.tsx
		}
		if (formState?.queued === false) toast.error("Failed to resend welcome email.");
	}, [formState]);

	return (
		<form action={formAction}>
			<Button type="submit" size="sm" className="gap-1">
				Resend welcome email
				<Gift size="18" />
			</Button>
			<input type="hidden" name="id" value={userId} />
		</form>
	);
}
