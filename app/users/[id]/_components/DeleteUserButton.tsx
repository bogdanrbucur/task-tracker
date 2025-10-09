"use client";
import { Alert, AlertTitle } from "@/components/ui/alert";
import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { AlertCircle, UserRoundX } from "lucide-react";
import { useEffect, useState } from "react";
import { useFormState } from "react-dom";
import { toast, Toaster } from "sonner";
import { Button } from "../../../../components/ui/button";
import deleteUser from "../_actions/deleteUser";

const initialState = {
	message: null,
	dialogOpen: undefined,
	success: undefined,
};

export default function DeleteUserButton({ userId }: { userId: string }) {
	const [formState, formAction] = useFormState(deleteUser, initialState);
	const [dialogOpen, setDialogOpen] = useState(false);

	// Watch for the success state to show a toast notification
	useEffect(() => {
		if (!formState?.message && formState?.success) {
			toast.success("User deleted succesfully.");
			// Redirect to the users page after 1000 ms
			setTimeout(() => {
				window.location.href = "/users";
			}, 1000);
		}
		if (formState?.success === false) toast.error("Failed to delete user.");
	}, [formState]);

	return (
		<>
			<AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
				<AlertDialogTrigger asChild>
					<Button size="sm" className="gap-1 bg-red-400" onClick={() => setDialogOpen(true)}>
						Delete
						<UserRoundX size="18" />
					</Button>
				</AlertDialogTrigger>
				<AlertDialogContent className="fade-in">
					<form action={formAction} className="space-y-3">
						<AlertDialogHeader>
							<AlertDialogTitle>Delete user?</AlertDialogTitle>
							<AlertDialogDescription>This will permanently and irreversibly delete this user but they can be recreated.</AlertDialogDescription>
							<AlertDialogDescription>This user was never active, so there is no data impact.</AlertDialogDescription>
						</AlertDialogHeader>
						{formState?.message && (
							<Alert variant="destructive" className="mt-2">
								<AlertCircle className="h-4 w-4" />
								<AlertTitle>{formState?.message}</AlertTitle>
							</Alert>
						)}
						<AlertDialogFooter>
							<AlertDialogCancel>Cancel</AlertDialogCancel>
							<Button type="submit">Confirm</Button>
						</AlertDialogFooter>
						<input type="hidden" name="id" value={userId} />
					</form>
				</AlertDialogContent>
			</AlertDialog>
			<Toaster richColors />
		</>
	);
}
