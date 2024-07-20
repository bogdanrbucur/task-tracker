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

export default function TaskStatusFilter() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [showall, setshowall] = useState<Checked>(false);
	const [showInProgress, setshowInProgress] = useState<Checked>(true);
	const [showCompleted, setshowCompleted] = useState<Checked>(true);
	const [showClosed, setshowClosed] = useState<Checked>(false);
	const [showCancelled, setshowCancelled] = useState<Checked>(false);
	const [showOverdue, setShowOverdue] = useState<Checked>(true);

	const statuses: any[] = [
		{
			label: "In Progress",
			value: 1,
			state: showInProgress,
			setter: setshowInProgress,
		},
		{
			label: "Overdue",
			value: 5,
			state: showOverdue,
			setter: setShowOverdue,
		},
		{
			label: "Completed",
			value: 2,
			state: showCompleted,
			setter: setshowCompleted,
		},
		{ label: "Closed", value: 3, state: showClosed, setter: setshowClosed },
		{
			label: "Cancelled",
			value: 4,
			state: showCancelled,
			setter: setshowCancelled,
		},
	];

	//
	// Select all others
	function selectAll() {
		statuses.forEach((status) => {
			status.setter(true);
		});
	}

	// useEffect to set the URL to the selected statuses
	useEffect(() => {
		const params = new URLSearchParams();

		// If all 5 statuses are selected, set the showall state to true
		if (showInProgress && showCompleted && showClosed && showCancelled && showOverdue) {
			setshowall(true);
			setshowInProgress(true);
			setshowCompleted(true);
			setshowClosed(true);
			setshowCancelled(true);
			setShowOverdue(true);
		} else setshowall(false);

		if (!showInProgress && !showCompleted && !showClosed && !showCancelled && !showOverdue) {
			setshowall(true);
			setshowInProgress(true);
			setshowCompleted(true);
			setshowClosed(true);
			setshowCancelled(true);
			setShowOverdue(true);
		}

		// Get the selected statuses
		const selectedStatuses = statuses
			.filter((status) => status.state)
			.map((status) => status.value)
			.join(",");

		// Add the existing searchPramas to the URL
		if (searchParams.get("orderBy")) params.append("orderBy", searchParams.get("orderBy")!);
		if (searchParams.get("sortOrder")) params.append("sortOrder", searchParams.get("sortOrder")!);
		if (selectedStatuses !== "") params.append("status", selectedStatuses);
		if (searchParams.get("dept")) params.append("dept", searchParams.get("dept")!);
		if (searchParams.get("user")) params.append("user", searchParams.get("user")!);
		if (searchParams.get("search")) params.append("search", searchParams.get("search")!);

		const query = selectedStatuses !== "" ? "?" + params.toString() : "";
		router.push(`/tasks${query}`);
	}, [showInProgress, showCompleted, showClosed, showCancelled, showOverdue]);

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
				<DropdownMenuCheckboxItem key="0" checked={showall} onCheckedChange={selectAll}>
					All
				</DropdownMenuCheckboxItem>
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
