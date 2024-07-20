"use client";
import { Gift } from "lucide-react";
import { useEffect } from "react";
import { useFormState } from "react-dom";
import { toast, Toaster } from "sonner";
import { Button } from "../../../../components/ui/button";
import passResetToken from "../_actions/passResetToken";

const initialState = {
	message: null,
};

export default function ResendWelcomeEmailButton({ userId }: { userId: string }) {
	const [formState, formAction] = useFormState(passResetToken, initialState);

	// Watch for the success state to show a toast notification
	useEffect(() => {
		console.log(formState);
		if (!formState?.message && formState?.emailSent === "success") toast.success("Welcome email resent.");
		if (formState?.emailSent === "fail") toast.error("Failed to resend welcome email.");
	}, [formState]);

	return (
		<form action={formAction}>
			<Toaster richColors />
			<Button type="submit" size="sm" className="gap-1">
				Resend welcome email
				<Gift size="18" />
			</Button>
			<input type="hidden" name="id" value={userId} />
		</form>
	);
}
