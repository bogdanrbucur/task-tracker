"use client";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

export const AvatarAndNameLarge = ({ firstName, lastName }: { firstName: string | undefined; lastName: string | undefined | null }) => {
	if (!firstName) return null;

	const initials = firstName.slice(0, 1).toUpperCase() + lastName?.slice(0, 1).toUpperCase();

	return (
		<div className="flex items-center gap-4">
			<Avatar>
				<AvatarImage alt={initials} />
				<AvatarFallback>{initials}</AvatarFallback>
			</Avatar>
			{firstName} {lastName}
		</div>
	);
};
export const AvatarAndNameSmall = ({ firstName, lastName }: { firstName: string | undefined; lastName: string | undefined | null }) => {
	if (!firstName) return null;

	const initials = firstName.slice(0, 1).toUpperCase() + lastName?.slice(0, 1).toUpperCase();

	return (
		<div className="flex items-center gap-2">
			<Avatar>
				<AvatarImage alt={initials} className="w-[20px] h-[20px]" />
				<AvatarFallback>{initials}</AvatarFallback>
			</Avatar>
			<small className="text-sm font-medium leading-none">{firstName} {lastName}</small>
		</div>
	);
};
