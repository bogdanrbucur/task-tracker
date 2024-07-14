"use client";
import { Gift } from "lucide-react";
import { useFormState } from "react-dom";
import { Button } from "../../../components/ui/button";
import passResetToken from "./passResetToken";

const initialState = {
	message: null,
};

export default function ResendWelcomeEmailButton({ userId }: { userId: string }) {
	const [state, formAction] = useFormState(passResetToken, initialState);

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
