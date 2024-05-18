"use client";
import { UserExtended } from "@/app/users/getUserById";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import React from "react";

export function UsersSelection({ users, onChange, defaultUser }: { users: UserExtended[]; onChange: (value: string | null) => void; defaultUser?: UserExtended }) {
	const [user, setUser] = React.useState<string | null>(defaultUser?.id ?? null);

	// Set the default date as the return from the compoennt, if it is provided
	React.useEffect(() => {
		if (defaultUser) handleOnChange(defaultUser.id);
	}, [defaultUser]);

	function handleOnChange(user: string | null) {
		setUser(user);
		onChange(user);
	}

	const defaultUserDisplay = defaultUser ? `${defaultUser.firstName} ${defaultUser.lastName} ${defaultUser.department ? `(${defaultUser.department.name})` : ""}` : null;

	return (
		<Select onValueChange={handleOnChange}>
			<SelectTrigger className={cn("w-[250px]", !user && "text-muted-foreground")}>
				<SelectValue placeholder={!user ? "Select a user" : defaultUserDisplay} />
			</SelectTrigger>
			<SelectContent>
				<SelectGroup>
					<SelectLabel>User</SelectLabel>
					{users.map((user) => (
						<SelectItem key={user.id} value={user.id}>
							{user.firstName} {user.lastName} {user.department ? `(${user.department.name})` : ""}
						</SelectItem>
					))}
				</SelectGroup>
			</SelectContent>
		</Select>
	);
}
