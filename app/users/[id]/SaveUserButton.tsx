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
import { AlertCircle, DoorOpen } from "lucide-react";
import { useFormState } from "react-dom";
import reopenTask from "../../(protected)/tasks/[id]/reopenTask";

const initialState = {
	message: null,
};

export function SaveUserButton({ userId, taskId }: { userId: string | undefined; taskId: number }) {
	const [state, formAction] = useFormState(reopenTask, initialState);

	return (
		<AlertDialog>
			<AlertDialogTrigger asChild>
				<Button size="sm" className="gap-1">
				{userId ? "Save User" : "Create User"}
				</Button>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<form action={formAction}>
					<AlertDialogHeader>
						<AlertDialogTitle>Reopen the task</AlertDialogTitle>
						<AlertDialogDescription>The task will be reopened and the assigned user informed. Please provide a short comment.</AlertDialogDescription>
					</AlertDialogHeader>
					{state?.message && (
						<Alert variant="destructive" className="mt-2">
							<AlertCircle className="h-4 w-4" />
							<AlertTitle>{state?.message}</AlertTitle>
						</Alert>
					)}
					<Textarea name="reopenComment" draggable="false" className="my-3" placeholder="Your comment..." />
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
