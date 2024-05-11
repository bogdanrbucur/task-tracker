"use client";
import { SelectionUser } from "@/app/(protected)/tasks/taskForm";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import React from "react";

export function UsersSelection({ users, onChange }: { users: SelectionUser[]; onChange: (value: string | null) => void }) {
	const [user, setUser] = React.useState<string | null>();

	function handleOnChange(user: string | null) {
		setUser(user);
		onChange(user);
	}

	return (
		<Select onValueChange={handleOnChange}>
			<SelectTrigger className={cn("w-[250px]", !user && "text-muted-foreground")}>
				<SelectValue placeholder="Select a user" />
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
