"use client";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { AlertCircle } from "lucide-react";
import { useRef } from "react";
import { useFormState } from "react-dom";
import PostCommentButton from "./PostCommentButton";
import addComment from "./addComment";
import CommentSkeleton from "./commentSkeleton";
import { UserAvatarNameComment } from "@/components/AvatarAndName";
import { Avatar } from "@prisma/client";

const initialState = {
	message: null,
};

export type CommentUser = {
	id: string;
	firstName: string;
	lastName: string;
	department: { name: string; id: number } | null;
	avatar: Avatar | null;
};

type CommentDetails = {
	comment: string;
	id: number;
	time: Date;
	user: CommentUser;
};

const CommentsSection = ({ userId, taskId, comments }: { userId?: string; taskId: number; comments: CommentDetails[] }) => {
	const [state, formAction] = useFormState(addComment, initialState);

	// Form reference to reset the form after submission
	const ref = useRef<HTMLFormElement>(null);

	return (
		<div className="space-y-6">
			<h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">Comments</h3>
			<form
				ref={ref}
				className="flex flex-col gap-4"
				action={(formData) => {
					formAction(formData);
					// Reset the form upon submission
					ref.current?.reset();
				}}
			>
				<section className="space-y-4">
					{comments.map((comment) => (
						<div key={comment.id} className="flex items-start gap-4">
							<UserAvatarNameComment user={comment.user} />
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
					<CommentSkeleton />
				</section>
				{userId && (
					<div className="flex flex-col gap-5">
						{/* <h4 className="scroll-m-20 text-lg font-semibold tracking-tight">Add comment</h4> */}
						{state?.message && (
							<Alert variant="destructive">
								<AlertCircle className="h-4 w-4" />
								<AlertTitle>{state?.message}</AlertTitle>
							</Alert>
						)}
						<Textarea name="comment" placeholder="Add a comment..." />
						<PostCommentButton />
						{/* Hidden input fields ensures formData is submitted */}
						<input type="hidden" name="userId" value={userId} />
						<input type="hidden" name="taskId" value={taskId} />
					</div>
				)}
			</form>
		</div>
	);
};

export default CommentsSection;
