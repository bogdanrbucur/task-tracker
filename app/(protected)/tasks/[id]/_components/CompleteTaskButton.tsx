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
import { useRouter } from "next/navigation";
import { RefObject, useActionState, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import completeTask from "../_actions/completeTask";

import AttachmentsUpload, { TaskAttachments } from "./AttachmentsUpload";

const initialState = {
	message: null,
};

export function CompleteTaskButton({ taskId, taskAttachments }: { taskId: number; taskAttachments: TaskAttachments[] }) {
	const [state, formAction] = useActionState(completeTask, initialState);
	const router = useRouter(); // Initialize useRouter
	const formRef = useRef<HTMLFormElement>(null);
	// Tracked here so Confirm can warn before completing with no completion attachment
	const [attachmentCount, setAttachmentCount] = useState(taskAttachments.length);

	// Refresh the page to refresh the attachments list when closing the dialog box
	const handleRevalidate = () => {
		router.refresh();
		console.log("Router push");
	};

	return (
		<AlertDialog>
			<AlertDialogTrigger asChild>
				<Button size="sm" className="gap-1" data-testid="complete-task-button">
					Complete
					<Check size="18" />
				</Button>
			</AlertDialogTrigger>
			<AlertDialogContent className="md:min-w-[800px]">
				<form action={formAction} ref={formRef}>
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
					<AttachmentsUpload taskId={taskId} taskAttachments={taskAttachments} type="completion" onAttachmentsChange={setAttachmentCount} />
					<AlertDialogFooter className="pt-4">
						<AlertDialogCancel onClick={handleRevalidate}>Close</AlertDialogCancel>
						<ConfirmTaskCompleteButton handleRevalidate={handleRevalidate} hasAttachments={attachmentCount > 0} formRef={formRef} />
					</AlertDialogFooter>
					<input type="hidden" name="taskId" value={taskId} />
				</form>
			</AlertDialogContent>
		</AlertDialog>
	);
}

// Button component that uses useFormStatus to be able to access the pending state
function ConfirmTaskCompleteButton({
	handleRevalidate,
	hasAttachments,
	formRef,
}: {
	handleRevalidate: () => void;
	hasAttachments: boolean;
	formRef: RefObject<HTMLFormElement | null>;
}) {
	const { pending } = useFormStatus();

	if (hasAttachments) {
		return (
			<Button type="submit" disabled={pending} onClick={handleRevalidate}>
				Confirm
			</Button>
		);
	}

	// No completion attachment: ask first. Choosing a file without clicking Add uploads nothing, so
	// this is the last chance to notice. The nested dialog is portaled outside the <form>, hence
	// requestSubmit() rather than a submit button.
	return (
		<AlertDialog>
			<AlertDialogTrigger asChild>
				<Button type="button" disabled={pending}>
					Confirm
				</Button>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Complete without attachment?</AlertDialogTitle>
					<AlertDialogDescription>
						No completion attachment has been added. If you chose a file, go back and click Add next to it - otherwise it will not be attached.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Go back</AlertDialogCancel>
					<AlertDialogAction
						data-testid="complete-without-attachment-button"
						onClick={() => {
							handleRevalidate();
							formRef.current?.requestSubmit();
						}}
					>
						Complete without attachment
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
