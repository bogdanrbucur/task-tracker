"use client";
import useCommentsKeyboardPress from "@/app/_hooks/useCommentsKeyboardPress";
import useMentionsListPosition from "@/app/_hooks/useMentionsListPosition";
import { UserExtended } from "@/app/users/getUserById";
import { UserAvatarNameComment } from "@/components/AvatarAndName";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Avatar } from "@prisma/client";
import { format } from "date-fns";
import { AlertCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useFormState } from "react-dom";
import { Toaster, toast } from "sonner";
import PostCommentButton from "./PostCommentButton";
import addComment from "./addComment";
import CommentSkeleton from "./commentSkeleton";

const initialState = {
	message: null,
	success: undefined,
	emailSent: undefined,
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

const CommentsSection = ({ userId, taskId, comments, users }: { userId?: string; taskId: number; comments: CommentDetails[]; users: UserExtended[] }) => {
	const [state, formAction] = useFormState(addComment, initialState);

	// Form reference to reset the form after submission
	const formRef = useRef<HTMLFormElement>(null);
	const textInputRef = useRef<HTMLTextAreaElement>(null);
	const mentionsListRef = useRef(null); // Mentions list ref

	// For @ mentions
	const [inputValue, setInputValue] = useState("");
	const [isMentioning, setIsMentioning] = useState(false);
	const [filteredUsers, setFilteredUsers] = useState(users);
	const [mentionStart, setMentionStart] = useState(-1);
	const [mentionedUsersIds, setMentionedUsersIds] = useState<string[]>([]); // Users mentioned in the comment
	const [mentionedUserNames, setMentionedUserNames] = useState<string[]>([]); // Users mentioned in the comment

	// Selected user for @ mention while the list is displayed
	const [highlightedIndex, setHighlightedIndex] = useState(0); // 0 means first item is highlighted

	// Remove the current user from the list of users
	users = users.filter((user) => user.id !== userId);

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
		setInputValue(`${beforeMention}@${user.firstName} ${user.lastName} `);
		setIsMentioning(false);
		setFilteredUsers([]);
	};

	// To watch for ArrowDown, ArrowUp and Enter key presses to navigate and select the filtered users list
	useCommentsKeyboardPress(
		setHighlightedIndex,
		filteredUsers,
		isMentioning,
		handleUserSelect,
		highlightedIndex,
		users[highlightedIndex],
		setIsMentioning,
		setFilteredUsers
	);

	// To determine the position of the mentionList based on the text cursor (caret position)
	useMentionsListPosition(isMentioning, textInputRef, mentionsListRef, formRef);

	// TODO move to a custom hook
	// Hook to watch if the comment section contains a user mention to add/remove the user from the form payload
	useEffect(() => {
		// Check if the inptuValue contains a mention of a user, from all the users
		const mentionedUsers = users.filter((user) => inputValue.includes(`@${user.firstName} ${user.lastName}`));

		// Remove users which are not in mentionedUsers
		const newMentionedUsersIds = mentionedUsersIds.filter((id) => mentionedUsers.map((user) => user.id).includes(id));
		setMentionedUsersIds(newMentionedUsersIds);
		const newMentionedUserNames = mentionedUserNames.filter((name) => mentionedUsers.map((user) => `${user.firstName} ${user.lastName}`).includes(name));
		setMentionedUserNames(newMentionedUserNames);

		// Fir each mentioned user, add their id to the arrays, if not already there
		mentionedUsers.forEach((user) => {
			if (!mentionedUsersIds.includes(user.id)) setMentionedUsersIds([...mentionedUsersIds, user.id]);
			if (!mentionedUserNames.includes(`${user.firstName} ${user.lastName}`)) setMentionedUserNames([...mentionedUserNames, `${user.firstName} ${user.lastName}`]);
		});
	}, [inputValue]);

	// Watch for the success state to show a toast notification
	useEffect(() => {
		if (state?.success && state?.emailSent) {
			// Reset the form
			formRef.current?.reset();
			toast.success(`Email sent to mentioned user${mentionedUsersIds.length === 1 ? "" : "s"}.`);
		}
		if (state?.message && !state?.emailSent) {
			toast.error("Failed to send email.");
		}
	}, [state]);

	return (
		<div className="space-y-6">
			<h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">Comments</h3>
			<form
				ref={formRef}
				className="flex flex-col gap-4"
				action={(formData) => {
					formAction(formData);
					// Reset the form upon submission
					setInputValue("");
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
						<Textarea name="comment" placeholder="Add a comment..." value={inputValue} onChange={handleInputChange} ref={textInputRef} />
						{isMentioning && (
							<ul
								ref={mentionsListRef}
								className="absolute z-10 list-disc shadow-lg max-h-56 overflow-auto rounded-lg border bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-700"
							>
								{filteredUsers.map((user, index) => (
									<li
										key={user.id}
										className={`cursor-pointer p-2 text-sm ${
											index === highlightedIndex ? "bg-gray-100 dark:bg-neutral-700" : "hover:bg-gray-100 dark:hover:bg-neutral-700"
										}`}
										onClick={() => handleUserSelect(user)}
									>
										{user.firstName} {user.lastName}
									</li>
								))}
							</ul>
						)}
						<div className="flex gap-3">
							<PostCommentButton />
							{mentionedUserNames.length > 0 ? (
								<p className="text-xs text-foreground">{mentionedUserNames.join(", ").replace(/,([^,]*)$/, " and$1")} will be notified of this comment.</p>
							) : (
								<p className="text-xs text-foreground"></p>
							)}
						</div>
						{/* Hidden input fields ensures formData is submitted */}
						<input type="hidden" name="userId" value={userId} />
						<input type="hidden" name="taskId" value={taskId} />
						<input type="hidden" name="mentionedUsers" value={mentionedUsersIds} />
					</div>
				)}
			</form>
			<Toaster richColors />
		</div>
	);
};

export default CommentsSection;
