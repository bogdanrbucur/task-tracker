import { getAuth } from "@/actions/auth/get-auth";
import { getPermissions } from "@/actions/auth/get-permissions";
import { signOut } from "@/actions/auth/sign-out";
import NavBarWelcome from "@/components/NavBarWelcome";
import { ModeToggle } from "@/components/themeToggle";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import getUserDetails from "../users/_actions/getUserById";
import { AdminMenu } from "./AdminMenu";

export const dynamic = "force-dynamic";

const Navbar = async () => {
	// Check user permissions
	const { user } = await getAuth();
	const userPermissions = await getPermissions(user?.id);

	// Get the user details for the welcome message
	let userDetails;
	if (user) {
		userDetails = await getUserDetails(user.id);
	}

	return (
		<nav className="container mx-auto flex justify-between space-x-1 px-3 py-2 md:space-x-3 md:px-3 ">
			<section className="flex space-x-2 md:space-x-3 items-center">
				<Link href="/" className="flex items-center py-0">
					<Image src="/logo.png" alt="logo" width="80" height="39" />
				</Link>
				{user && (
					<Link href="/tasks?status=1%2C5%2C2" className={cn(buttonVariants({ variant: "ghost" }), "px-1 md:px-4")}>
						Tasks
					</Link>
				)}
				{userPermissions?.isAdmin && <AdminMenu />}
			</section>
			<div className="flex items-center space-x-1 md:space-x-3">
				{user && userDetails && (
					<span className="hidden md:block">
						<NavBarWelcome user={{ id: userDetails.id, firstName: userDetails.firstName }} />
					</span>
				)}
				{user && (
					<form action={signOut}>
						<Button variant="outline" type="submit" size="sm" className="px-2 md:px-4" data-testid="signout-button">
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
