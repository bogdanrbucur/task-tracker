// "use client";
import { getAuth } from "@/app/_auth/actions/get-auth";
import NavBarWelcome from "@/components/NavBarWelcome";
import { ModeToggle } from "@/components/themeToggle";
import { Button, buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { getPermissions } from "./_auth/actions/get-permissions";
import { signOut } from "./_auth/actions/sign-out";
import getUserDetails from "./users/getUserById";
import Image from "next/image";

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
		<nav className="container mx-auto flex justify-between space-x-1 px-3 py-2 md:space-x-3 md:px-3 ">
			<section className="flex space-x-1 md:space-x-3">
				<Link href="/" className="flex items-center">
					<Image src="/logo.png" alt="logo" width="100" height="50" />
				</Link>
				{user && (
					<Link href="/tasks?status=1%2C2" className={buttonVariants({ variant: "ghost" })}>
						Tasks
					</Link>
				)}
				{userPermissions?.isAdmin && (
					<Link href="/users" className={buttonVariants({ variant: "ghost" })}>
						Users
					</Link>
				)}
			</section>
			<div className="flex items-center space-x-1 md:space-x-3">
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
