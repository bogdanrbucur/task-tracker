"use client";
import { KeySquare } from "lucide-react";
import { useEffect } from "react";
import { useFormState } from "react-dom";
import { toast, Toaster } from "sonner";
import { Button } from "../../../components/ui/button";
import passResetToken from "./passResetToken";

const initialState = {
	message: null,
	emailSent: undefined,
};

export default function ResetPasswordButton({ userId }: { userId: string }) {
	const [formState, formAction] = useFormState(passResetToken, initialState);

	// Watch for the success state to show a toast notification
	useEffect(() => {
		console.log(formState);
		if (!formState?.message && formState?.emailSent === "success") toast.success("Password reset email sent.");
		if (formState?.emailSent === "fail") toast.error("Failed to send password reset email.");
	}, [formState]);

	return (
		<form action={formAction}>
			<Toaster richColors />
			<Button type="submit" size="sm" className="gap-1">
				Password Reset Email
				<KeySquare size="18" />
			</Button>
			<input type="hidden" name="id" value={userId} />
		</form>
	);
}
