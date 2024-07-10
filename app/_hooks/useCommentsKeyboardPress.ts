import { useEffect } from "react";
import { UserExtended } from "../users/getUserById";

export default function useCommentsKeyboardPress(
	setHighlightedIndex: (prevIndex: any) => void,
	filteredUsers: UserExtended[],
	isMentioning: boolean,
	handleUserSelect: (userToMention: UserExtended) => void,
	highlightedIndex: number,
	userToMention: UserExtended,
	setIsMentioning: (isMentioning: boolean) => void,
	setFilteredUsers: (filteredUsers: UserExtended[]) => void
) {
	return useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (filteredUsers.length === 0) setHighlightedIndex(0);

			if (e.key === "ArrowDown") {
				e.preventDefault(); // Prevent scrolling
				setHighlightedIndex((prevIndex: any) => Math.min(filteredUsers.length - 1, prevIndex + 1));
			} else if (e.key === "ArrowUp") {
				e.preventDefault(); // Prevent scrolling
				setHighlightedIndex((prevIndex: any) => Math.max(0, prevIndex - 1));
			} else if (e.key === "Enter" && isMentioning && highlightedIndex >= 0) {
				const userToMention = filteredUsers[highlightedIndex];
				// Ensure the user exists
				if (userToMention) {
					handleUserSelect(userToMention);
					e.preventDefault(); // Prevent new line
				}
			} else if (e.key === "Escape") {
				setIsMentioning(false);
				setFilteredUsers([]);
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [filteredUsers, highlightedIndex, isMentioning]); // Make sure to re-bind the event when filteredUsers or highlightedIndex changes
}
