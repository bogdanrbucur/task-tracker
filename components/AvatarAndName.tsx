"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";

const AvatarAndName = ({ firstName, lastName }: { firstName: string | undefined; lastName: string | undefined | null }) => {
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

export default AvatarAndName;
