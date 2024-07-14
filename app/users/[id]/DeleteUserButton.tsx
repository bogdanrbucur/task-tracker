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
import { useState } from "react";
import { useFormState } from "react-dom";
import { Button } from "../../../components/ui/button";
import deleteUser from "./deleteUser";

const initialState = {
	message: null,
	dialogOpen: undefined,
};

export default function DeleteUserButton({ userId }: { userId: string }) {
	const [state, formAction] = useFormState(deleteUser, initialState);
	const [dialogOpen, setDialogOpen] = useState(false);

	return (
		<AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
			<AlertDialogTrigger asChild>
				<Button size="sm" className="gap-1" onClick={() => setDialogOpen(true)}>
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
					{state?.message && (
						<Alert variant="destructive" className="mt-2">
							<AlertCircle className="h-4 w-4" />
							<AlertTitle>{state?.message}</AlertTitle>
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
	);
}
