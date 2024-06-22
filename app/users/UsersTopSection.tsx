import { getAuth } from "@/app/_auth/actions/get-auth";
import { getPermissions } from "@/app/_auth/actions/get-permissions";
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
				<UserSearchFilter />
			</div>
			{userPermissions?.isAdmin && (
				<Button asChild size="sm">
					<Link href="/users/new">New User</Link>
				</Button>
			)}
		</div>
	);
};

export default UsersTopSection;
