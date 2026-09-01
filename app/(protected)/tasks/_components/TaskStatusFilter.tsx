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

const ALL_STATUS_IDS = [1, 2, 3, 4, 5];

// Read the status ids currently in the URL (e.g. "1,5,2"). Returns null when the param is
// absent so we can fall back to the default selection below.
function statusIdsFromParams(raw: string | null): Set<number> | null {
	if (!raw) return null;
	return new Set(
		raw
			.split(",")
			.map((s) => parseInt(s))
			.filter((n) => !isNaN(n))
	);
}

// Order-independent equality so re-deriving the same selection from the URL is a no-op.
function sameIds(a: Set<number>, b: Set<number>) {
	return a.size === b.size && [...a].every((id) => b.has(id));
}

export default function TaskStatusFilter() {
	const router = useRouter();
	const searchParams = useSearchParams();

	// Initialise from the URL so a back-navigation (or a shared link) keeps the active status
	// filter instead of snapping back to the defaults.
	const initialIds = statusIdsFromParams(searchParams.get("status"));
	const initiallyChecked = (id: number, fallback: boolean) => (initialIds ? initialIds.has(id) : fallback);

	const [showInProgress, setshowInProgress] = useState<Checked>(initiallyChecked(1, true));
	const [showCompleted, setshowCompleted] = useState<Checked>(initiallyChecked(2, true));
	const [showClosed, setshowClosed] = useState<Checked>(initiallyChecked(3, false));
	const [showCancelled, setshowCancelled] = useState<Checked>(initiallyChecked(4, false));
	const [showOverdue, setShowOverdue] = useState<Checked>(initiallyChecked(5, true));

	// Derived, not stored: the "All" box is ticked exactly when every status is.
	const showall = Boolean(showInProgress && showCompleted && showClosed && showCancelled && showOverdue);

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

	// Keep the URL's `status` param in sync with the checkboxes.
	//
	// This effect is deliberately idempotent: it derives the selection, compares it (order
	// independently) against what the URL already says, and returns early when they match.
	// That makes the mount pass - and React StrictMode's double-invoke in dev - a no-op, so
	// simply landing on the list (e.g. via the browser Back button) never rewrites the URL and
	// never drops the `page` param. The URL is only touched on a real selection change, and a
	// real filter change resets pagination to page 1.
	useEffect(() => {
		const selected = statuses.filter((s) => s.state).map((s) => s.value as number);
		// Empty selection is treated as "all" - previous behaviour; stops the list from
		// silently showing every status when the last box is unticked.
		if (!selected.length) {
			statuses.forEach((s) => s.setter(true)); // re-tick; this effect re-runs with the full set
			return;
		}
		const selectedIds = new Set<number>(selected);

		const currentIds = statusIdsFromParams(searchParams.get("status")) ?? new Set<number>();
		if (currentIds.size && sameIds(currentIds, selectedIds)) return;

		const params = new URLSearchParams(searchParams.toString());
		params.set("status", [...selectedIds].join(","));
		params.delete("page"); // a filter change starts again from page 1
		router.push(`/tasks?${params.toString()}`);
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
