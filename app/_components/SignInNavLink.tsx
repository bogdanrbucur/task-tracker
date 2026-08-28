"use client";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { usePathname } from "next/navigation";

// A separate client component only because it needs the current path, unlike the rest of Navbar
// which is an async server component reading the session via getAuth().
export default function SignInNavLink() {
	const pathname = usePathname();
	if (pathname === "/sign-in") return null;

	return (
		<Link href="/sign-in" className={buttonVariants({ variant: "outline", size: "sm" })}>
			Sign In
		</Link>
	);
}
