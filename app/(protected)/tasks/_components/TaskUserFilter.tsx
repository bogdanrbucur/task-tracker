"use client";

import { UserExtended } from "@/app/users/_actions/getUserById";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export function TaskUserFilter({ users }: { users: UserExtended[] }) {
	const router = useRouter();
	const searchParams = useSearchParams();
	// Seed from the URL so a back-navigation (or a shared link) keeps the active user filter.
	const existingUser = searchParams.get("user");
	const [open, setOpen] = useState(false);
	const [userId, setUserId] = useState(existingUser ?? "");

	// Keep the URL's `user` param in sync with the selection.
	//
	// Idempotent by design: it returns early when the selection already matches the URL, so the
	// mount pass - and React StrictMode's double-invoke in dev - is a no-op. Landing on the list
	// via the browser Back button therefore never rewrites the URL and never drops `page`. The
	// URL is only touched on a real change, which resets pagination to page 1.
	useEffect(() => {
		if ((searchParams.get("user") ?? "") === userId) return;

		const params = new URLSearchParams(searchParams.toString());
		if (userId) params.set("user", userId);
		else params.delete("user");
		params.delete("page"); // a filter change starts again from page 1
		router.push(`/tasks?${params.toString()}`);
	}, [userId]);

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button variant="outline" role="combobox" size="sm" aria-expanded={open} className="w-[200px] justify-between">
					{userId ? `${users.find((user) => user.id === userId)?.firstName} ${users.find((user) => user.id === userId)?.lastName}` : "Filter by user"}
					<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-[200px] p-0">
				<Command>
					<CommandInput placeholder="Search user..." />
					<CommandEmpty>No user found.</CommandEmpty>
					<CommandGroup>
						{users.map((user) => (
							<CommandList key={user.id}>
								{/* useState to set the userId and then useEffect to monitor the change and update the URL */}
								<CommandItem onSelect={() => setUserId(user.id === userId ? "" : user.id)}>
									<Check className={cn("mr-2 h-4 w-4", userId === user.id ? "opacity-100" : "opacity-0")} />
									{user.firstName} {user.lastName}
								</CommandItem>
							</CommandList>
						))}
					</CommandGroup>
				</Command>
			</PopoverContent>
		</Popover>
	);
}
