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
import { Check } from "lucide-react";
import closeTask from "./closeTask";

export async function CompleteTaskButton({ userId, taskId }: { userId: string | undefined; taskId: number }) {
	return (
		<AlertDialog>
			<AlertDialogTrigger asChild>
				<Button size="sm" className="gap-1">
					Complete
					<Check size="18" />
				</Button>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<form action={closeTask}>
					<AlertDialogHeader>
						<AlertDialogTitle>Complete the task</AlertDialogTitle>
						<AlertDialogDescription>You hereby confirm the task is completed and ready to be reviewed. Please provide a short comment.</AlertDialogDescription>
					</AlertDialogHeader>
					<Textarea name="completeComment" draggable="false" className="my-3" placeholder="Your comment..." />
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
