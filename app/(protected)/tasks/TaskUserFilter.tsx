"use client";

import { UserExtended } from "@/app/users/getUserById";
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
	const [open, setOpen] = useState(false);
	const [userId, setUserId] = useState("");

	// Update the URL when the selected userId changes
	useEffect(() => {
		const params = new URLSearchParams();
		// Add the existing searchPramas to the URL
		if (searchParams.get("orderBy")) params.append("orderBy", searchParams.get("orderBy")!);
		if (searchParams.get("sortOrder")) params.append("sortOrder", searchParams.get("sortOrder")!);
		if (searchParams.get("status")) params.append("status", searchParams.get("status")!);
		if (searchParams.get("dept")) params.append("dept", searchParams.get("dept")!);
		// Add the selected user to the URL
		if (userId !== "") params.append("user", userId);
		if (userId === "") params.delete("user");
		if (searchParams.get("search")) params.append("search", searchParams.get("search")!);


		const query = params.toString() ? "?" + params.toString() : "";
		router.push(`/tasks${query}`);
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
