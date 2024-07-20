"use client";
import { UserExtended, UserRestricted } from "@/app/users/_actions/getUserById";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface Props {
	users: UserExtended[];
	onChange: (value: string | null) => void;
	defaultUser?: UserRestricted;
	disabled?: boolean;
}

export function UsersSelection({ users, onChange, defaultUser, disabled }: Props) {
	const [user, setUser] = useState<string | null>(defaultUser?.id ?? null);

	// Set the default date as the return from the compoennt, if it is provided
	useEffect(() => {
		if (defaultUser) handleOnChange(defaultUser.id);
	}, [defaultUser]);

	function handleOnChange(user: string | null) {
		setUser(user);
		onChange(user);
	}

	const defaultUserDisplay = defaultUser ? `${defaultUser.firstName} ${defaultUser.lastName}` : null;
	const selectedFirstName = user ? users.find((u) => u.id === user)?.firstName : null;
	const selectedLastName = user ? users.find((u) => u.id === user)?.lastName : null;

	return (
		<Select onValueChange={handleOnChange} disabled={disabled}>
			<SelectTrigger className={cn("max-w-prose", !user && "text-muted-foreground")}>
				<SelectValue placeholder={defaultUser ? defaultUserDisplay : "Select a user..."}>
					<div className="flex gap-2 items-center">
						<span>
							{selectedFirstName} {selectedLastName}
						</span>
					</div>
				</SelectValue>
			</SelectTrigger>
			<SelectContent>
				<SelectGroup>
					{/* <SelectLabel>User</SelectLabel> */}
					{users.map((user) => (
						<SelectItem key={user.id} value={user.id}>
							<div className="flex gap-2 items-center">
								<span>
									{user.firstName} {user.lastName}
								</span>
								<span className="text-xs text-gray-500 dark:text-gray-400">{user.position}</span>
							</div>
						</SelectItem>
					))}
				</SelectGroup>
			</SelectContent>
		</Select>
	);
}
