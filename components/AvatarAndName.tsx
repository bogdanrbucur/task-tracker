"use client";
import { UserExtended, UserRestricted } from "@/app/users/getUserById";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

export const UserAvatarNameNormal = ({ user }: { user: UserExtended | UserRestricted | null }) => {
	if (!user) return null;
	const initials = user.firstName.slice(0, 1).toUpperCase() + user.lastName?.slice(0, 1).toUpperCase();
	// Get the avatar file from the server
	const avatar = user.avatar ? `/avatars/${user.id}` : undefined;
	return (
		<div className="flex items-center gap-4">
			<Link href={`/users/${user.id}`}>
				<Avatar>
					<AvatarImage alt={initials} src={avatar} />
					<AvatarFallback>{initials}</AvatarFallback>
				</Avatar>
			</Link>
			<div>
				<Link href={`/users/${user.id}`}>
					{user.firstName} {user.lastName}
					<p className="text-xs text-muted-foreground">{user.position}</p>
				</Link>
			</div>
		</div>
	);
};
export const UserAvatarNameSmall = ({ user }: { user: UserExtended | UserRestricted | null }) => {
	if (!user) return null;
	const initials = user.firstName.slice(0, 1).toUpperCase() + user.lastName?.slice(0, 1).toUpperCase();
	// Get the avatar file from the server
	const avatar = user.avatar ? `/avatars/${user.id}` : undefined;
	return (
		<div className="flex items-center gap-2">
			<Avatar>
				<AvatarImage src={avatar} alt={initials} />
				<AvatarFallback>{initials}</AvatarFallback>
			</Avatar>
			<small className="text-sm font-medium leading-none">
				{user.firstName} {user.lastName} <p className="text-xs text-muted-foreground">{user.position}</p>
			</small>
		</div>
	);
};

export const UserAvatarNameLarge = ({ user }: { user: UserExtended | null }) => {
	if (!user) return null;
	const initials = user.firstName.slice(0, 1).toUpperCase() + user.lastName?.slice(0, 1).toUpperCase();
	// Get the avatar file from the server
	const avatar = user.avatar ? `/avatars/${user.id}` : undefined;

	return (
		<div className="flex items-center gap-4">
			<Avatar>
				<AvatarImage src={avatar} alt={initials} />
				<AvatarFallback>{initials}</AvatarFallback>
			</Avatar>
			<div>
				<h1 className="text-2xl font-bold">
					{user.firstName} {user.lastName}
				</h1>
				<p className="text-muted-foreground">{user.position}</p>
			</div>
		</div>
	);
};
