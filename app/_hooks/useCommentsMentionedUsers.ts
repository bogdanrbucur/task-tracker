import { useEffect } from "react";
import { UserExtended } from "../users/getUserById";

// Custom hook to watch if the comment section contains a user mention to add/remove the user from the form payload
export default function useCommentsMentionedUsers(
	users: UserExtended[],
	inputValue: string,
	mentionedUsersIds: string[],
	setMentionedUsersIds: (ids: string[]) => void,
	mentionedUserNames: string[],
	setMentionedUserNames: (names: string[]) => void
) {
	return useEffect(() => {
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
}
