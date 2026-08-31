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
import { Button } from "@/components/ui/button";
import { AlertCircle, CircleX } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import deleteTemplate from "../_actions/deleteTemplate";
import type { TemplateRow } from "./TemplatesTable";

const initialState = { message: null, success: undefined };

export default function DeleteTemplateButton({ template }: { template: TemplateRow }) {
	const [state, formAction] = useActionState(deleteTemplate, initialState);
	const [dialogOpen, setDialogOpen] = useState(false);

	useEffect(() => {
		if (state?.success) window.location.reload();
	}, [state?.success]);

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
						<AlertDialogTitle>Delete checklist template</AlertDialogTitle>
					</AlertDialogHeader>
					<AlertDialogDescription>
						Are you sure you wish to delete the <strong>{template.name}</strong> template? Tasks already using its items are not affected.
					</AlertDialogDescription>
					{state?.message && (
						<Alert variant="destructive" className="mt-2">
							<AlertCircle className="h-4 w-4" />
							<AlertTitle>{state.message}</AlertTitle>
						</Alert>
					)}
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<Button type="submit">Confirm</Button>
					</AlertDialogFooter>
					<input type="hidden" name="id" value={template.id} />
				</form>
			</AlertDialogContent>
		</AlertDialog>
	);
}
