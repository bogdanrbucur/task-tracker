"use client";
import { Button } from "@/components/ui/button";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Unlink } from "lucide-react";
import { startTransition, useActionState, useState } from "react";
import unlinkMicrosoft from "../_actions/unlinkMicrosoft";

const initialState = { message: null };

export default function UnlinkMicrosoftButton({ userId, entraUpn }: { userId: string; entraUpn: string | null }) {
	const [state, formAction] = useActionState(unlinkMicrosoft, initialState);
	const [dialogOpen, setDialogOpen] = useState(false);

	function confirm() {
		const formData = new FormData();
		formData.append("id", userId);
		startTransition(() => formAction(formData));
		setDialogOpen(false);
	}

	return (
		<>
			<Button size="sm" variant="outline" className="gap-1" onClick={() => setDialogOpen(true)} data-testid="unlink-m365">
				Unlink Microsoft 365
				<Unlink size="16" />
			</Button>
			{state?.message && <p className="text-xs text-red-500">{state.message}</p>}
			<AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
				<AlertDialogContent className="z-50">
					<AlertDialogHeader>
						<AlertDialogTitle>Unlink Microsoft 365 account?</AlertDialogTitle>
						<AlertDialogDescription>
							This user is linked to {entraUpn ?? "a Microsoft account"}. They will no longer be able to sign in with Microsoft until they link
							again, which happens automatically the next time they use the Microsoft button. Their password and access are unchanged.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction onClick={confirm}>Unlink</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
