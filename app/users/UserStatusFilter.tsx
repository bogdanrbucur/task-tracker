"use client";

import { DropdownMenuCheckboxItemProps } from "@radix-ui/react-dropdown-menu";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEffect, useState } from "react";

type Checked = DropdownMenuCheckboxItemProps["checked"];

export default function UserStatusFilter() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [showActive, setShowActive] = useState<Checked>(true);
	const [showInactive, setShowInactive] = useState<Checked>(false);

	const statuses: any[] = [
		{
			label: "Active",
			value: true,
			state: showActive,
			setter: setShowActive,
		},
		{
			label: "Inactive",
			value: false,
			state: showInactive,
			setter: setShowInactive,
		},
	];

	// useEffect to set the URL to the selected statuses
	useEffect(() => {
		const params = new URLSearchParams();
		// Get the selected statuses
		const selectedStatuses = statuses
			.filter((status) => status.state)
			.map((status) => status.value)
			.join(",");

		// If no statuses are selected, show active users
		if (selectedStatuses === "") setShowActive(true);

		// Add the selected statuses to the URL
		if (selectedStatuses !== "") params.append("active", selectedStatuses);

		// Add the existing searchPramas to the URL
		if (searchParams.get("orderBy")) params.append("orderBy", searchParams.get("orderBy")!);
		if (searchParams.get("sortOrder")) params.append("sortOrder", searchParams.get("sortOrder")!);

		const query = selectedStatuses !== "" ? "?" + params.toString() : "";
		router.push(`/users${query}`);
	}, [showActive, showInactive]);

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="outline" size="sm">
					Filter by status
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent className="w-36">
				<DropdownMenuLabel>Status</DropdownMenuLabel>
				<DropdownMenuSeparator />
				{statuses.map((status) => (
					<DropdownMenuCheckboxItem key={status.value} checked={status.state} onCheckedChange={status.setter}>
						{status.label}
					</DropdownMenuCheckboxItem>
				))}
				<DropdownMenuSeparator />
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
