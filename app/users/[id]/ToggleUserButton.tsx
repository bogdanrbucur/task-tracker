"use client";
import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { UserRoundCheck, UserRoundX } from "lucide-react";
import { useState } from "react";
import { useFormState } from "react-dom";
import { Button } from "../../../components/ui/button";
import toggleUser from "./toggleUser";

const initialState = {
	message: null,
	dialogOpen: undefined,
};

export default function ToggleUserButton({
	userId,
	status,
	tasksNumber,
	subordinatesNumber,
}: {
	userId: string;
	status: string;
	tasksNumber: number;
	subordinatesNumber: number;
}) {
	const [state, formAction] = useFormState(toggleUser, initialState);
	const [dialogOpen, setDialogOpen] = useState(false);

	function handleSubmit(e: { preventDefault: () => void }) {
		e.preventDefault();
		if (tasksNumber > 0 || subordinatesNumber > 0) {
			setDialogOpen(true);
			return;
		}

		const formData = new FormData();
		formData.append("id", userId);
		formAction(formData);
	}

	return (
		<>
			<form onSubmit={handleSubmit}>
				<Button size="sm" className="gap-1">
					{status === "active" ? "Deactivate" : "Activate"}
					{status === "active" ? <UserRoundX size="18" /> : <UserRoundCheck size="18" />}
				</Button>
			</form>
			{dialogOpen && (
				<AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>Unable to deactivate user</AlertDialogTitle>
							<AlertDialogDescription>
								{tasksNumber > 0 && subordinatesNumber === 0 ? "User has assigned tasks." : ""}
								{subordinatesNumber > 0 && tasksNumber === 0 ? "User has subordinates." : ""}
								{tasksNumber > 0 && subordinatesNumber > 0 ? "User has assigned tasks and subordinates." : ""}
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel onSubmit={(state) => setDialogOpen(!state)}>Cancel</AlertDialogCancel>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			)}
		</>
	);
}
