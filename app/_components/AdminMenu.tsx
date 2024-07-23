"use client";

import Link from "next/link";
import * as React from "react";

import { Icons } from "@/components/icons";
import {
	NavigationMenu,
	NavigationMenuContent,
	NavigationMenuItem,
	NavigationMenuLink,
	NavigationMenuList,
	NavigationMenuTrigger,
	navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";

export function AdminMenu() {
	return (
		<NavigationMenu>
			<NavigationMenuList>
				<NavigationMenuItem>
					<NavigationMenuTrigger className="px-1 md:px-4">Admin</NavigationMenuTrigger>
					<NavigationMenuContent>
						<ul className="grid gap-1 md:gap-3 p-1 md:p-2 md:w-[350px]">
							<ListItem href="/users" title="Users">
								Manage users, roles, and permissions.
							</ListItem>
							<ListItem href="/departments" title="Departments">
								Manage departments.
							</ListItem>
						</ul>
					</NavigationMenuContent>
				</NavigationMenuItem>
			</NavigationMenuList>
		</NavigationMenu>
	);
}

const ListItem = React.forwardRef<React.ElementRef<"a">, React.ComponentPropsWithoutRef<"a">>(({ className, title, children, ...props }, ref) => {
	return (
		<li>
			<NavigationMenuLink asChild>
				<a
					ref={ref}
					className={cn(
						"block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
						className
					)}
					{...props}
				>
					<div className="text-sm font-medium leading-none">{title}</div>
					<p className="hidden md:block line-clamp-2 text-sm leading-snug text-muted-foreground">{children}</p>
				</a>
			</NavigationMenuLink>
		</li>
	);
});
ListItem.displayName = "ListItem";
