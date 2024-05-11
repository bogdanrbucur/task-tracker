"use client";
import { SelectionUser } from "@/app/(protected)/tasks/taskForm";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import React from "react";

export function UsersSelection({ users, onChange, defaultUser }: { users: SelectionUser[]; onChange: (value: string | null) => void; defaultUser?: SelectionUser }) {
	const [user, setUser] = React.useState<string | null>(defaultUser?.id ?? null);

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
