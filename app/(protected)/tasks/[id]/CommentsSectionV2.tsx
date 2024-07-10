"use client";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { AlertCircle } from "lucide-react";
import { useRef, useState } from "react";
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

const users = [
	{ id: "1", firstName: "John", lastName: "Doe" },
	{ id: "2", firstName: "Jane", lastName: "Doe" },
];

const CommentsSection = ({ userId, taskId, comments }: { userId?: string; taskId: number; comments: CommentDetails[] }) => {
	const [state, formAction] = useFormState(addComment, initialState);
	const ref = useRef<HTMLFormElement>(null);
	const [inputValue, setInputValue] = useState("");
	const [isMentioning, setIsMentioning] = useState(false);
	const [filteredUsers, setFilteredUsers] = useState(users);
	const [mentionStart, setMentionStart] = useState(-1);

	const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		const value = e.target.value;
		setInputValue(value);

		const cursorPosition = e.target.selectionStart as number;
		const mentionIndex = value.lastIndexOf("@", cursorPosition - 1);

		if (mentionIndex !== -1) {
			setIsMentioning(true);
			setMentionStart(mentionIndex);
			const mentionQuery = value.substring(mentionIndex + 1, cursorPosition).toLowerCase();
			const newFilteredUsers = users.filter((user) => `${user.firstName} ${user.lastName}`.toLowerCase().includes(mentionQuery));
			setFilteredUsers(newFilteredUsers);
		} else {
			setIsMentioning(false);
			setFilteredUsers([]);
		}
	};

	const handleUserSelect = (user: any) => {
		const beforeMention = inputValue.substring(0, mentionStart);
		const afterMention = inputValue.substring(inputValue.indexOf(" ", mentionStart + 1));
		setInputValue(`${beforeMention}@${user.firstName} ${user.lastName}${afterMention}`);
		setIsMentioning(false);
		setFilteredUsers([]);
	};

	return (
		<div className="space-y-6">
			<h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">Comments</h3>
			<form
				ref={ref}
				className="flex flex-col gap-4"
				onSubmit={(e) => {
					e.preventDefault();
					const formData = new FormData(e.target as HTMLFormElement);
					formAction(formData);
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
					{/* Input field for new comment with @mention functionality */}
					<textarea className="form-textarea mt-1 block w-full" rows={3} placeholder="Add a comment..." value={inputValue} onChange={handleInputChange}></textarea>
					{isMentioning && (
						<ul className="absolute z-10 list-disc bg-white shadow-lg max-h-56 overflow-auto">
							{filteredUsers.map((user) => (
								<li key={user.id} className="cursor-pointer p-2 hover:bg-gray-100" onClick={() => handleUserSelect(user)}>
									{user.firstName} {user.lastName}
								</li>
							))}
						</ul>
					)}
				</section>
				<button type="submit" className="self-end px-4 py-2 bg-blue-500 text-white rounded-md">
					Post Comment
				</button>
			</form>
		</div>
	);
};

export default CommentsSection;
