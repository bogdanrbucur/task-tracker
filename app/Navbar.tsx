// "use client";
import { ModeToggle } from "@/components/themeToggle";
import { Button, buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { getAuth } from "@/app/_auth/actions/get-auth";
import { GrTask } from "react-icons/gr";
import { signOut } from "./_auth/actions/sign-out";
import { getUserPermissions } from "./_auth/actions/get-permissions";

const Navbar = async () => {
	const { user } = await getAuth();

	let userPermissions;
	if (user) userPermissions = await getUserPermissions(user.id);

	return (
		<nav className="p-3 flex justify-between space-x-3">
			{/* TODO replace with logo */}
			<section className="flex space-x-3">
				<Link href="/" className={buttonVariants({ variant: "ghost" })}>
					<GrTask size="23" />
				</Link>
				<Link href="/tasks" className={buttonVariants({ variant: "ghost" })}>
					Tasks
				</Link>
				{userPermissions?.canCreateUsers && (
					<Link href="/users" className={buttonVariants({ variant: "ghost" })}>
						Users
					</Link>
				)}
			</section>
			<div className="flex space-x-3">
				{user && (
					<form action={signOut}>
						<Button variant="outline" type="submit">
							Sign Out
						</Button>
					</form>
				)}
				<ModeToggle />
			</div>
		</nav>
	);
};

export default Navbar;
