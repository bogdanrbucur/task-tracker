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
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import reopenTask from "../_actions/reopenTask";

const initialState = {
	message: null,
};

export function ReopenTaskButton({ userId, taskId }: { userId: string | undefined; taskId: number }) {
	const [state, formAction] = useActionState(reopenTask, initialState);

	return (
		<AlertDialog>
			<AlertDialogTrigger asChild>
				<Button size="sm" className="gap-1">
					Reopen
					<DoorOpen size="18" />
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
						<ConfirmTaskReopenButton />
					</AlertDialogFooter>
					<input type="hidden" name="userId" value={userId} />
					<input type="hidden" name="taskId" value={taskId} />
				</form>
			</AlertDialogContent>
		</AlertDialog>
	);
}

// Button component that uses useFormStatus to be able to access the pending state
function ConfirmTaskReopenButton() {
	const { pending } = useFormStatus();
	return (
		<Button type="submit" disabled={pending}>
			Confirm
		</Button>
	);
}

export default ConfirmTaskReopenButton;
