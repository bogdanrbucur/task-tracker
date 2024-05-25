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
import { UserExtended } from "../getUserById";
import Link from "next/link";
import submitUser from "../new/submitUser";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface Props {
	editor: string;
	user?: UserExtended;
	users: UserExtended[];
	departments: Department[];
}

const initialState = {
	message: null,
};

export default function UserForm({ editor, user, users, departments }: Props) {
	const [formState, formAction] = useFormState(submitUser, initialState);
	const [managerId, setManagerId] = useState<string | null>(null);
	const [departmentId, setDepartmentId] = useState<number | null>(null);

	return (
		<Card className="container w-full max-w-2xl">
			<div className="container mx-auto px-4 py-6">
				<h1 className="mb-8 text-3xl font-bold">{user ? "Edit User" : "New User"}</h1>
				<form className="space-y-4 md:space-y-6" action={formAction}>
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="firstName">First Name</Label>
							<Input name="firstName" placeholder="John" defaultValue={user ? user.firstName : undefined} required />
						</div>
						<div className="space-y-2">
							<Label htmlFor="lastName">Last Name</Label>
							<Input name="lastName" placeholder="Doe" defaultValue={user ? user.lastName : undefined} required />
						</div>
					</div>
					<div className="space-y-2">
						<Label htmlFor="email">Email</Label>
						<Input name="email" placeholder="example@email.com" defaultValue={user ? user.email : undefined} required type="email" />
					</div>
					<div className="space-y-2">
						<Label htmlFor="position">Position</Label>
						<Input name="position" placeholder="Technical Assistant" defaultValue={user ? user.position : undefined} required />
					</div>
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="departmentId">Department</Label>
							<DepartmentSelection departments={departments} onChange={setDepartmentId} />
							<input type="hidden" name="departmentId" defaultValue={user ? user.department?.name : undefined} value={departmentId ?? ""} />
						</div>
						<div className="space-y-2">
							<Label htmlFor="managerId">Manager</Label>
							<UsersSelection users={users} onChange={setManagerId} />
							<input type="hidden" name="managerId" defaultValue={user ? `${user.manager?.firstName} ${user.manager?.lastName}` : undefined} value={managerId ?? ""} />
						</div>
					</div>
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="password">Password</Label>
							<Input name="password" placeholder="Password" type="password" required />
						</div>
						<div className="space-y-2">
							<Label htmlFor="confirmPassword">Confirm Password</Label>
							<Input name="confirmPassword" placeholder="Confirm Password" type="password" required />
						</div>
					</div>
					<div className="space-y-2 max-w-md grid grid-cols-2 gap-4">
						<div>
							<Label htmlFor="avatar">Avatar</Label>
							<div className="flex items-center gap-4">
								<Avatar className="h-12 w-12">
									<AvatarImage alt="Avatar" src="/placeholder-avatar.jpg" />
									<AvatarFallback>JD</AvatarFallback>
								</Avatar>
								<Input id="avatar" type="file" />
							</div>
						</div>
						<div className="flex items-center space-x-2">
							<Checkbox name="isAdmin" defaultChecked={user ? user.isAdmin : false} />
							<label htmlFor="isAdmin" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
								Admin user
							</label>
						</div>
					</div>
					{formState?.message && (
						<Alert variant="destructive">
							<AlertCircle className="h-4 w-4" />
							<AlertTitle>User could not be created</AlertTitle>
							<AlertDescription>{formState?.message}</AlertDescription>
						</Alert>
					)}
					<div className="flex justify-between">
						<div className="flex justify-center md:justify-end">
							<Button asChild>
								<Link href={`/users/${user?.id ? user.id : ""}`}>Cancel</Link>
							</Button>
						</div>
						<input type="hidden" name="editor" value={editor} />
						<input type="hidden" name="id" value={user ? user.id : undefined} />
						<div className="flex justify-center md:justify-end">
							<Button type="submit">{user ? "Save User" : "Create User"}</Button>
						</div>
					</div>
				</form>
			</div>
		</Card>
	);
}
