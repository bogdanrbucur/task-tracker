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
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, CircleX } from "lucide-react";
import { useActionState }  from "react";
import cancelTask from "../_actions/cancelTask";

const initialState = {
	message: null,
};

export function CancelTaskButton({ userId, taskId }: { userId: string | undefined; taskId: number }) {
	const [state, formAction] = useActionState(cancelTask, initialState);

	return (
		<AlertDialog>
			<AlertDialogTrigger asChild>
				<Button size="sm" className="gap-1 bg-red-400">
					Cancel
					<CircleX size="18" />
				</Button>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<form action={formAction}>
					<AlertDialogHeader>
						<AlertDialogTitle>Cancel the task</AlertDialogTitle>
						<AlertDialogDescription>You hereby confirm the task is not required and can be cancelled. Please provide a reason for cancelling.</AlertDialogDescription>
					</AlertDialogHeader>
					{state?.message && (
						<Alert variant="destructive" className="mt-2">
							<AlertCircle className="h-4 w-4" />
							<AlertTitle>{state?.message}</AlertTitle>
						</Alert>
					)}
					<Textarea name="cancelComment" draggable="false" className="my-3" placeholder="Reason for cancelling..." />
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<Button type="submit">Confirm</Button>
					</AlertDialogFooter>
					<input type="hidden" name="userId" value={userId} />
					<input type="hidden" name="taskId" value={taskId} />
				</form>
			</AlertDialogContent>
		</AlertDialog>
	);
}
