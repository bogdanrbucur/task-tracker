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
import { AlertCircle, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useFormState } from "react-dom";
import completeTask from "../_actions/completeTask";
import AttachmentsUpload, { TaskAttachments } from "./AttachmentsUpload";

const initialState = {
	message: null,
};

export function CompleteTaskButton({ userId, taskId, taskAttachments }: { userId: string | undefined; taskId: number; taskAttachments: TaskAttachments[] }) {
	const [state, formAction] = useFormState(completeTask, initialState);
	const router = useRouter(); // Initialize useRouter

	// Refresh the page to refresh the attachments list when closing the dialog box
	const handleRevalidate = () => {
		router.refresh();
		console.log("Router push");
	};

	return (
		<AlertDialog>
			<AlertDialogTrigger asChild>
				<Button size="sm" className="gap-1">
					Complete
					<Check size="18" />
				</Button>
			</AlertDialogTrigger>
			<AlertDialogContent className="md:min-w-[800px]">
				<form action={formAction}>
					<AlertDialogHeader>
						<AlertDialogTitle>Complete the task</AlertDialogTitle>
						<AlertDialogDescription>
							You hereby confirm the task is completed and ready to be reviewed. Please provide a short comment and you may also attach files.
						</AlertDialogDescription>
					</AlertDialogHeader>
					{state?.message && (
						<Alert variant="destructive" className="mt-2">
							<AlertCircle className="h-4 w-4" />
							<AlertTitle>{state?.message}</AlertTitle>
						</Alert>
					)}
					<Textarea name="completeComment" draggable="false" className="my-3" placeholder="Your comment..." />
					{/* Completion attachments section */}
					<AttachmentsUpload taskId={taskId} taskAttachments={taskAttachments} type="completion" />
					<AlertDialogFooter className="pt-4">
						<AlertDialogCancel onClick={handleRevalidate}>Close</AlertDialogCancel>
						<Button type="submit" onClick={handleRevalidate}>
							Confirm
						</Button>
					</AlertDialogFooter>
					<input type="hidden" name="userId" value={userId} />
					<input type="hidden" name="taskId" value={taskId} />
				</form>
			</AlertDialogContent>
		</AlertDialog>
	);
}
