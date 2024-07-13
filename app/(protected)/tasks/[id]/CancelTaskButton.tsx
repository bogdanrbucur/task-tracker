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
import { CircleX } from "lucide-react";
import cancelTask from "./cancelTask";

export async function CancelTaskButton({ userId, taskId }: { userId: string | undefined; taskId: number }) {
	return (
		<AlertDialog>
			<AlertDialogTrigger asChild>
				<Button size="sm" className="gap-1">
					Cancel
					<CircleX size="18" />
				</Button>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<form action={cancelTask}>
					<AlertDialogHeader>
						<AlertDialogTitle>Cancel the task</AlertDialogTitle>
						<AlertDialogDescription>You hereby confirm the task is not required and can be cancelled. Please provide a reason for cancelling.</AlertDialogDescription>
					</AlertDialogHeader>
					<Textarea name="cancelComment" draggable="false" className="my-3" placeholder="Reason for cancelling..." />
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
