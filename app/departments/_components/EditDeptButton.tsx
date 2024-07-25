"use client";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Department } from "@prisma/client";
import { AlertCircle, SquarePen } from "lucide-react";
import { useEffect, useState } from "react";
import { useFormState } from "react-dom";
import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "../../../components/ui/alert-dialog";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import editDept from "../_actions/editDept";
const initialState = {
	message: null,
	dialogOpen: undefined,
	success: undefined,
};

export default function EditDeptButton({ dept }: { dept?: Department }) {
	const [state, formAction] = useFormState(editDept, initialState);
	const isNewDept = !dept;

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
				<Button size="sm" className="gap-1 min-w-24 max-w-32" onClick={() => setDialogOpen(true)}>
					{isNewDept ? "New Department" : "Rename"}
					{isNewDept ? null : <SquarePen size="18" />}
				</Button>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<form action={formAction} className="space-y-3">
					<AlertDialogHeader>
						<AlertDialogTitle>{isNewDept ? "Create department" : "Rename department"}</AlertDialogTitle>
					</AlertDialogHeader>
					{state?.message && (
						<Alert variant="destructive" className="mt-2">
							<AlertCircle className="h-4 w-4" />
							<AlertTitle>{state?.message}</AlertTitle>
						</Alert>
					)}
					<Label htmlFor="deptName">{isNewDept ? "Department name" : "Current name"}</Label>
					<Input name="deptName" type="text" defaultValue={dept?.name} required />
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
