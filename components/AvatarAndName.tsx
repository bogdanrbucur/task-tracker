"use client";
import { CommentUser } from "@/app/(protected)/tasks/[id]/_components/CommentsSection";
import { UserExtended, UserRestricted } from "@/app/users/_actions/getUserById";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const UserAvatarNameNormal = ({ user }: { user: UserExtended | UserRestricted | null }) => {
	if (!user) return null;
	const initials = user.firstName.slice(0, 1).toUpperCase() + user.lastName?.slice(0, 1).toUpperCase();
	// Get the avatar file from the server
	const avatar = user.avatar ? `/api/avatars/${user.id}` : undefined;
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
	const avatar = user.avatar ? `/api/avatars/${user.id}` : undefined;
	return (
		<div className="flex items-center gap-2">
			<Avatar>
				<AvatarImage src={avatar} alt={initials} />
				<AvatarFallback>{initials}</AvatarFallback>
			</Avatar>
			<small className={`text-sm font-medium leading-none`}>
				<span className={user.status === "inactive" ? "text-red-600 dark:text-red-400" : user.status === "unverified" ? "text-yellow-600 dark:text-yellow-400" : ""}>
					{user.firstName} {user.lastName}
				</span>{" "}
				<p className="text-xs text-muted-foreground">{user.position}</p>
			</small>
		</div>
	);
};

export const UserAvatarNameLarge = ({ user }: { user: UserExtended | null }) => {
	if (!user) return null;
	const initials = user.firstName.slice(0, 1).toUpperCase() + user.lastName?.slice(0, 1).toUpperCase();
	// Get the avatar file from the server
	const avatar = user.avatar ? `/api/avatars/${user.id}` : undefined;

	return (
		<div className="flex items-center gap-4">
			<Avatar style={{ width: "6rem", height: "6rem" }}>
				<AvatarImage src={avatar} alt={initials} />
				<AvatarFallback className="text-4xl">{initials}</AvatarFallback>
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
export const UserAvatarNameComment = ({ user }: { user: CommentUser | null }) => {
	if (!user) return null;
	const initials = user.firstName.slice(0, 1).toUpperCase() + user.lastName?.slice(0, 1).toUpperCase();
	// Get the avatar file from the server
	const avatar = user.avatar ? `/api/avatars/${user.id}` : undefined;

	return (
		<Avatar>
			<AvatarImage src={avatar} alt={initials} />
			<AvatarFallback>{initials}</AvatarFallback>
		</Avatar>
	);
};
