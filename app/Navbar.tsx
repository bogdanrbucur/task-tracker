"use client";
import { ModeToggle } from "@/components/themeToggle";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";

import { GrTask } from "react-icons/gr";

const Navbar = () => {
	return (
		<nav className="p-2 flex justify-between">
			{/* TODO replace with logo */}
			<section className="flex">
				<Link href="/" className={buttonVariants({ variant: "ghost" })}>
					<GrTask size="23" />
				</Link>
				<Link href="/tasks" className={buttonVariants({ variant: "ghost" })}>
					Tasks
				</Link>
				<Link href="/users" className={buttonVariants({ variant: "ghost" })}>
					Users
				</Link>
			</section>
			<ModeToggle />
		</nav>
	);
};

export default Navbar;
