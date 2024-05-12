"use client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { AlertCircle } from "lucide-react";
import { useState } from "react";
import { useFormState } from "react-dom";
import addComment from "./addComment";

const initialState = {
	message: null,
};

type CommentDetails = {
	comment: string;
	id: number;
	time: Date;
	user: { firstName: string; lastName: string; department: { name: string; id: number } | null };
};

const CommentsSection = ({ userId, taskId, comments }: { userId?: string; taskId: number; comments: CommentDetails[] }) => {
	const [state, formAction] = useFormState(addComment, initialState);
	const [comment, setComment] = useState("");

	const handleSubmit = (event: any) => {
		event.preventDefault();
		const formData = new FormData(event.target);
		formData.append("userId", userId ? userId : "");
		formData.append("taskId", String(taskId));

		// Invoke the server side function to add new task
		formAction(formData);

		// Clear the comment field
		setComment("");
	};

	return (
		<div className="space-y-6">
			<h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">Comments</h3>
			<section className="space-y-4">
				{comments.map((comment) => (
					<div key={comment.id} className="flex items-start gap-4">
						<Avatar>
							<AvatarImage alt="@shadcn" />
							<AvatarFallback>{comment.user.firstName.slice(0, 1).toUpperCase() + comment.user.lastName?.slice(0, 1).toUpperCase()}</AvatarFallback>
						</Avatar>
						<div className="flex-1">
							<div className="flex items-center justify-between">
								<div className="font-medium">
									{comment.user.firstName} {comment.user.lastName}
								</div>
								<div className="text-xs text-gray-500 dark:text-gray-400">{format(comment.time, "dd MMM yyyy HH:mm")}</div>
							</div>
							<p className="text-sm text-gray-500 dark:text-gray-400">{comment.comment}</p>
						</div>
					</div>
				))}
			</section>
			{userId && (
				<form className="flex flex-col gap-4" onSubmit={handleSubmit}>
					{/* <h4 className="scroll-m-20 text-lg font-semibold tracking-tight">Add comment</h4> */}
					<Textarea name="comment" placeholder="Add a comment..." value={comment} onChange={(e) => setComment(e.target.value)} />
					<Button type="submit" size="sm" className="w-[130px]">
						Post Comment
					</Button>
					{state?.message && (
						<Alert variant="destructive">
							<AlertCircle className="h-4 w-4" />
							<AlertTitle>Failed to add comment</AlertTitle>
							<AlertDescription>{state?.message}</AlertDescription>
						</Alert>
					)}
				</form>
			)}
		</div>
	);
};

export default CommentsSection;
