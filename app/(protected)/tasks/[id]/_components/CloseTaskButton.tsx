"use client";
import { Alert, AlertTitle } from "@/components/ui/alert";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, Check } from "lucide-react";
import { useFormState } from "react-dom";
import closeTask from "../_actions/closeTask";

const initialState = {
	message: null,
};

export function CloseTaskButton({ userId, taskId }: { userId: string | undefined; taskId: number }) {
	const [state, formAction] = useFormState(closeTask, initialState);

	return (
		<AlertDialog>
			<AlertDialogTrigger asChild>
				<Button size="sm" className="gap-1">
					Close
					<Check size="18" />
				</Button>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<form action={formAction}>
					<AlertDialogHeader>
						<AlertDialogTitle>Close the task</AlertDialogTitle>
						<AlertDialogDescription>You hereby confirm the task is completed and can be closed. You may provide an optional closing comment.</AlertDialogDescription>
					</AlertDialogHeader>
					{state?.message && (
						<Alert variant="destructive" className="mt-2">
							<AlertCircle className="h-4 w-4" />
							<AlertTitle>{state?.message}</AlertTitle>
						</Alert>
					)}
					<Textarea name="closeComment" draggable="false" className="my-3" placeholder="Optional comment..." />
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction type="submit">Confirm</AlertDialogAction>
					</AlertDialogFooter>
					<input type="hidden" name="userId" value={userId} />
					<input type="hidden" name="taskId" value={taskId} />
				</form>
			</AlertDialogContent>
		</AlertDialog>
	);
}
