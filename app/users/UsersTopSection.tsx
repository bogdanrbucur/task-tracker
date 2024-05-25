import { getAuth } from "@/app/_auth/actions/get-auth";
import { getPermissions } from "@/app/_auth/actions/get-permissions";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const UsersTopSection = async () => {
	const { user } = await getAuth();

	const userPermissions = await getPermissions(user?.id);

	return (
		<div className="flex justify-between py-3">
			<div></div>
			{userPermissions?.isAdmin && (
				<Button asChild variant="outline" size="sm">
					<Link href="/users/new">New User</Link>
				</Button>
			)}
		</div>
	);
};

export default UsersTopSection;
