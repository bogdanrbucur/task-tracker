import { getAuth } from "@/actions/auth/get-auth";
import { getPermissions } from "@/actions/auth/get-permissions";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import UserStatusFilter from "./UserStatusFilter";
import { UserSearchFilter } from "./UserSearchFilter";

const UsersTopSection = async () => {
	const { user } = await getAuth();

	const userPermissions = await getPermissions(user?.id);

	return (
		<div className="flex justify-between py-1 md:py-3 gap-x-3">
			<div className="flex gap-x-3">
				<UserStatusFilter />
			</div>
			<div className="flex gap-x-3">
				<UserSearchFilter />
				{userPermissions?.isAdmin && (
					<Button asChild size="sm">
						<Link href="/users/new">New User</Link>
					</Button>
				)}
			</div>
		</div>
	);
};

export default UsersTopSection;
