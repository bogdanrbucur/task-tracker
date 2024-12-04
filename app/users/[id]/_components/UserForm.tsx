"use client";
import { DepartmentSelection } from "@/components/DepartmentSelection";
import { UsersSelection } from "@/components/UsersSelection";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Department } from "@prisma/client";
import { AlertCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useFormState } from "react-dom";
import { UserExtended } from "../../_actions/getUserById";
import submitUser from "../../new/submitUser";

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
	const [imageUrl, setImageUrl] = useState<string | null>(null);
	const [isAdminChecked, setIsAdminChecked] = useState<boolean>(false);
	const editingSelf = editor === user?.id;

	// Get the avatar file from the server
	const avatar = user?.avatar ? `/api/avatars/${user.id}` : undefined;
	useEffect(() => {
		if (avatar) setImageUrl(avatar);
	}, [avatar]);

	const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (file) {
			const reader = new FileReader();
			reader.onloadend = () => {
				setImageUrl(reader.result as string);
			};
			reader.readAsDataURL(file);
		}
	};

	const onIsAdminCheckboxChange = (checked: boolean) => setIsAdminChecked(checked);

	return (
		<Card className="container w-full max-w-2xl px-3 py-3 md:px-8 md:py-6">
			<div className="fade-in container mx-auto p-0">
				<h1 className="mb-4 md:mb-8 text-2xl md:text-3xl font-bold">{user ? "Edit User" : "New User"}</h1>
				<form className="space-y-3 md:space-y-6" action={formAction}>
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
						<Input name="email" placeholder="example@email.com" defaultValue={user ? user.email : undefined} required type="email" disabled={editingSelf} />
					</div>
					<div className="space-y-2">
						<Label htmlFor="position">Position</Label>
						<Input name="position" placeholder="Technical Assistant" defaultValue={user ? user.position : undefined} required disabled={editingSelf} />
					</div>
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="departmentId">Department</Label>
							<DepartmentSelection
								departments={departments}
								onChange={setDepartmentId}
								defaultDept={user?.department ? user?.department : undefined}
								disabled={editingSelf}
							/>
							<input type="hidden" name="departmentId" value={departmentId ?? ""} />
						</div>
						<div className="space-y-2">
							<Label htmlFor="managerId">Manager</Label>
							<UsersSelection users={users} onChange={setManagerId} defaultUser={user?.manager ? user.manager : undefined} disabled={editingSelf} />
							<input type="hidden" name="managerId" value={managerId ?? ""} />
						</div>
					</div>
					<div className="space-y-2">
						<Label htmlFor="avatar">Avatar</Label>
						<div className="flex items-center gap-4">
							<Avatar className="h-16 w-16 md:h-20 md:w-20">
								<AvatarImage alt="Avatar" src={imageUrl || ""} />
								<AvatarFallback>JD</AvatarFallback>
							</Avatar>
							<Input name="avatar" type="file" accept="image/*" onChange={handleImageChange} />
						</div>
					</div>
					{/* Do not allow admins to un-make themselves admins */}
					{editor !== user?.id && (
						<div>
							<div className="flex items-center space-x-2 justify-start pl-3">
								<Checkbox name="isAdmin" defaultChecked={user ? user.isAdmin : false} onCheckedChange={onIsAdminCheckboxChange} />
								<div>
									<label htmlFor="isAdmin" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
										Admin user
									</label>
								</div>
							</div>
							<p className={`text-xs ${isAdminChecked ? "text-red-600 dark:text-red-400" : "text-muted-foreground"} pl-3`}>
								User will have full control over all tasks and all users, including other administrators.
							</p>
						</div>
					)}

					{formState?.message && (
						<Alert variant="destructive">
							<AlertCircle className="h-4 w-4" />
							<AlertTitle>Changes not saved</AlertTitle>
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
							<Button className="gap-1" type="submit">
								{user ? "Save User" : "Create User"}
							</Button>
						</div>
					</div>
				</form>
			</div>
		</Card>
	);
}
