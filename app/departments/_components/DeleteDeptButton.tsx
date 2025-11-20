"use client";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Department } from "@prisma/client";
import { AlertCircle, CircleX } from "lucide-react";
import { useActionState, useEffect, useState } from "react";

import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "../../../components/ui/alert-dialog";
import { Button } from "../../../components/ui/button";
import deleteDept from "../_actions/deleteDept";
const initialState = {
	message: null,
	dialogOpen: undefined,
	success: undefined,
};

export default function DeleteDeptButton({ dept }: { dept: Department }) {
	const [state, formAction] = useActionState(deleteDept, initialState);

	// Crappy state workaround to keep the dialog open
	const [dialogOpen, setDialogOpen] = useState(false);
	useEffect(() => {
		setDialogOpen(state!.dialogOpen!);
	}, [state?.dialogOpen]);

	// Listen for changes in the success state
	useEffect(() => {
		if (state?.success) {
			// If the operation was successful, perform a full page reload
			window.location.reload();
		}
	}, [state?.success]); // This effect depends on the success state

	return (
		<AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
			<AlertDialogTrigger asChild>
				<Button size="sm" className="gap-1 min-w-24 max-w-24 bg-red-400" onClick={() => setDialogOpen(true)}>
					Delete <CircleX size="18" />
				</Button>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<form action={formAction} className="space-y-3">
					<AlertDialogHeader>
						<AlertDialogTitle>Delete department</AlertDialogTitle>
					</AlertDialogHeader>
					<AlertDialogDescription>
						Are you sure you wish to delete <strong>{dept.name}</strong> department?
					</AlertDialogDescription>
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
					<input type="hidden" name="id" value={dept?.id} />
				</form>
			</AlertDialogContent>
		</AlertDialog>
	);
}
