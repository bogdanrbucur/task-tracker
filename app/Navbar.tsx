// "use client";
import { getAuth } from "@/app/_auth/actions/get-auth";
import NavBarWelcome from "@/components/NavBarWelcome";
import { ModeToggle } from "@/components/themeToggle";
import { Button, buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { GrTask } from "react-icons/gr";
import { getPermissions } from "./_auth/actions/get-permissions";
import { signOut } from "./_auth/actions/sign-out";
import getUserDetails from "./users/getUserById";

const Navbar = async () => {
	// Check user permissions
	const { user } = await getAuth();
	const userPermissions = await getPermissions(user?.id);

	// Get the user details for the welcome message
	let userProps;
	if (user) {
		userProps = await getUserDetails(user.id);
	}

	return (
		<nav className="flex justify-between space-x-1 md:space-x-3 container mx-auto px-3 py-2 md:px-3">
			{/* TODO replace with logo */}
			<section className="flex space-x-1 md:space-x-3">
				<Link href="/" className={buttonVariants({ variant: "ghost" })}>
					<GrTask size="23" />
				</Link>
				{user && (
					<Link href="/tasks" className={buttonVariants({ variant: "ghost" })}>
						Tasks
					</Link>
				)}
				{userPermissions?.isAdmin && (
					<Link href="/users" className={buttonVariants({ variant: "ghost" })}>
						Users
					</Link>
				)}
			</section>
			<div className="flex space-x-1 md:space-x-3 items-center">
				<NavBarWelcome userProps={userProps} />
				{user && (
					<form action={signOut}>
						<Button variant="outline" type="submit" size="sm">
							Sign Out
						</Button>
					</form>
				)}
				{!user && (
					<Link href="/sign-in" className={buttonVariants({ variant: "outline" })}>
						Sign In
					</Link>
				)}
				<ModeToggle />
			</div>
		</nav>
	);
};

export default Navbar;
