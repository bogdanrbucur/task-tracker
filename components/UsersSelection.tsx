"use client";
import { SelectionUser } from "@/app/(protected)/tasks/taskForm";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";

export function UsersSelection({ users, onChange }: { users: SelectionUser[]; onChange: (value: string) => void }) {
	return (
		<Select onValueChange={onChange}>
			<SelectTrigger className="w-[250px]">
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
