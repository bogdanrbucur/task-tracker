"use client";
import { UserExtended, UserRestricted } from "@/app/users/getUserById";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

export function UsersSelection({ users, onChange, defaultUser }: { users: UserExtended[]; onChange: (value: string | null) => void; defaultUser?: UserRestricted }) {
	const [user, setUser] = useState<string | null>(defaultUser?.id ?? null);

	// Set the default date as the return from the compoennt, if it is provided
	useEffect(() => {
		if (defaultUser) handleOnChange(defaultUser.id);
	}, [defaultUser]);

	function handleOnChange(user: string | null) {
		setUser(user);
		onChange(user);
	}

	const defaultUserDisplay = defaultUser ? `${defaultUser.firstName} ${defaultUser.lastName} ${defaultUser.department ? `(${defaultUser.department.name})` : ""}` : null;

	return (
		<Select onValueChange={handleOnChange}>
			<SelectTrigger className={cn("max-w-prose", !user && "text-muted-foreground")}>
				<SelectValue placeholder={!user ? "Select a user" : defaultUserDisplay} />
			</SelectTrigger>
			<SelectContent>
				<SelectGroup>
					{/* <SelectLabel>User</SelectLabel> */}
					{users.map((user) => (
						<SelectItem key={user.id} value={user.id}>
							<div className="flex gap-2 items-center">
								<div>
									{user.firstName} {user.lastName}
								</div>
								<div className="text-xs text-gray-500 dark:text-gray-400"> {user.department ? `(${user.department.name})` : ""}</div>
							</div>
						</SelectItem>
					))}
				</SelectGroup>
			</SelectContent>
		</Select>
	);
}
