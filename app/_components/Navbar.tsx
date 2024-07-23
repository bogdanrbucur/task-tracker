// "use client";
import { getAuth } from "@/actions/auth/get-auth";
import { getPermissions } from "@/actions/auth/get-permissions";
import { signOut } from "@/actions/auth/sign-out";
import NavBarWelcome from "@/components/NavBarWelcome";
import { ModeToggle } from "@/components/themeToggle";
import { Button, buttonVariants } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import getUserDetails from "../users/_actions/getUserById";
import { AdminMenu } from "./AdminMenu";
import { cn } from "@/lib/utils";

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
			<section className="flex space-x-1 md:space-x-3 items-center">
				<Link href="/" className="flex items-center">
					<Image src="/logo.png" alt="logo" width="100" height="50" />
				</Link>
				{user && (
					<Link href="/tasks?status=1%2C5%2C2" className={cn(buttonVariants({ variant: "ghost" }), "px-1 md:px-4")}>
						Tasks
					</Link>
				)}
				{userPermissions?.isAdmin && <AdminMenu />}
			</section>
			<div className="flex items-center space-x-1 md:space-x-3">
				<span className="hidden md:block">
					<NavBarWelcome userProps={userProps} />
				</span>
				{user && (
					<form action={signOut}>
						<Button variant="outline" type="submit" size="sm" className="px-1 md:px-4">
							Sign Out
						</Button>
					</form>
				)}
				{!user && (
					<Link href="/sign-in" className={buttonVariants({ variant: "outline", size: "sm" })}>
						Sign In
					</Link>
				)}
				<ModeToggle />
			</div>
		</nav>
	);
};

export default Navbar;
