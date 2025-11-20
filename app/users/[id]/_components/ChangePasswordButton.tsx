"use client";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, KeySquare } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "../../../../components/ui/alert-dialog";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { Label } from "../../../../components/ui/label";
import changeUserPassword from "../_actions/changeUserPassword";

const initialState = {
	message: null,
	dialogOpen: undefined,
};

export default function ChangePasswordButton({ userId }: { userId: string }) {
	const [state, formAction] = useActionState(changeUserPassword, initialState);

	// Crappy state workaround to keep the dialog open
	const [dialogOpen, setDialogOpen] = useState(false);
	useEffect(() => {
		setDialogOpen(state!.dialogOpen!);
	}, [state?.dialogOpen]);

	return (
		<AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
			<AlertDialogTrigger asChild>
				<Button size="sm" className="gap-1" onClick={() => setDialogOpen(true)}>
					Change Password
					<KeySquare size="18" />
				</Button>
			</AlertDialogTrigger>
			<AlertDialogContent className="fade-in">
				<form action={formAction} className="space-y-3">
					<AlertDialogHeader>
						<AlertDialogTitle>Change password</AlertDialogTitle>
					</AlertDialogHeader>
					{state?.message && (
						<Alert variant="destructive" className="mt-2">
							<AlertCircle className="h-4 w-4" />
							<AlertTitle>{state?.message}</AlertTitle>
						</Alert>
					)}
					<Label htmlFor="oldPassword">Current password</Label>
					<Input name="oldPassword" type="password" required />
					<Label htmlFor="newPassword">New password</Label>
					<Input name="newPassword" type="password" required />
					<Label htmlFor="confirmPassword">Confirm password</Label>
					<Input name="confirmPassword" type="password" required />
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<Button type="submit">Confirm</Button>
					</AlertDialogFooter>
					<input type="hidden" name="id" value={userId} />
				</form>
			</AlertDialogContent>
		</AlertDialog>
	);
}
