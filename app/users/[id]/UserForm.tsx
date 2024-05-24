"use client";
import { DepartmentSelection } from "@/components/DepartmentSelection";
import { UsersSelection } from "@/components/UsersSelection";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Department } from "@prisma/client";
import { useState } from "react";
import { useFormState } from "react-dom";
import { signUp } from "../../_auth/actions/sign-up";
import { UserExtended } from "../getUserById";

interface Props {
	user?: UserExtended;
	users: UserExtended[];
	departments: Department[];
}

const initialState = {
	message: null,
};

export default function UserForm({ user, users, departments }: Props) {
	const [formState, formAction] = useFormState(signUp, initialState);
	const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
	const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | null>(null);

	return (
		<Card className="container w-full max-w-2xl">
			<div className="container mx-auto px-4 py-6">
				{/* <div className="mx-auto space-y-6"> */}
				<h1 className="mb-8 text-3xl font-bold">{user ? "Edit User" : "New User"}</h1>
				<div className="space-y-4">
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="first-name">First Name</Label>
							<Input id="first-name" placeholder="John" required />
						</div>
						<div className="space-y-2">
							<Label htmlFor="last-name">Last Name</Label>
							<Input id="last-name" placeholder="Doe" required />
						</div>
					</div>
					<div className="space-y-2">
						<Label htmlFor="email">Email</Label>
						<Input id="email" placeholder="example@acme.com" required type="email" />
					</div>
					<div className="space-y-2">
						<Label htmlFor="position">Position</Label>
						<Input id="position" placeholder="Software Engineer" required />
					</div>
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="department">Department</Label>
							<DepartmentSelection departments={departments} onChange={setSelectedDepartmentId} />
						</div>
						<div className="space-y-2">
							<Label htmlFor="manager">Manager</Label>
							<UsersSelection users={users} onChange={setSelectedUserId} />
						</div>
					</div>
					<div className="space-y-2 max-w-md">
						<Label htmlFor="avatar">Avatar</Label>
						<div className="flex items-center gap-4">
							<Avatar className="h-12 w-12">
								<AvatarImage alt="Avatar" src="/placeholder-avatar.jpg" />
								<AvatarFallback>JD</AvatarFallback>
							</Avatar>
							<Input id="avatar" type="file" />
						</div>
					</div>
					<Button className="w-full" type="submit">
						Sign Up
					</Button>
				</div>
				{/* </div> */}
			</div>
		</Card>
	);
}
