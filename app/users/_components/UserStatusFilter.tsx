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

// Read the status values currently in the URL (e.g. "active,inactive"). Returns null when the
// param is absent so we can fall back to the default selection below.
function statusValuesFromParams(raw: string | null): Set<string> | null {
	if (!raw) return null;
	return new Set(
		raw
			.split(",")
			.map((s) => s.trim())
			.filter(Boolean)
	);
}

// Order-independent equality so re-deriving the same selection from the URL is a no-op.
function sameValues(a: Set<string>, b: Set<string>) {
	return a.size === b.size && [...a].every((v) => b.has(v));
}

export default function UserStatusFilter() {
	const router = useRouter();
	const searchParams = useSearchParams();

	// Initialise from the URL so a back-navigation (or a shared link) keeps the active status
	// filter instead of snapping back to the defaults.
	const initialValues = statusValuesFromParams(searchParams.get("status"));
	const initiallyChecked = (value: string, fallback: boolean) => (initialValues ? initialValues.has(value) : fallback);

	const [showActive, setShowActive] = useState<Checked>(initiallyChecked("active", true));
	const [showInactive, setShowInactive] = useState<Checked>(initiallyChecked("inactive", false));
	const [showUnverified, setShowUnverified] = useState<Checked>(initiallyChecked("unverified", true));

	const statuses: any[] = [
		{
			label: "Active",
			value: "active",
			state: showActive,
			setter: setShowActive,
		},
		{
			label: "Unverified",
			value: "unverified",
			state: showUnverified,
			setter: setShowUnverified,
		},
		{
			label: "Inactive",
			value: "inactive",
			state: showInactive,
			setter: setShowInactive,
		},
	];

	// Keep the URL's `status` param in sync with the checkboxes.
	//
	// Idempotent by design: it derives the selection, compares it (order independently) against
	// what the URL already says, and returns early when they match. That makes the mount pass -
	// and React StrictMode's double-invoke in dev - a no-op, so simply landing on the list (e.g.
	// via the browser Back button) never rewrites the URL and never drops the `page` param. The
	// URL is only touched on a real selection change, which resets pagination to page 1.
	useEffect(() => {
		const selected = statuses.filter((status) => status.state).map((status) => status.value as string);

		// If no statuses are selected, fall back to active users (previous behaviour).
		if (!selected.length) {
			setShowActive(true);
			return;
		}
		const selectedValues = new Set<string>(selected);

		const currentValues = statusValuesFromParams(searchParams.get("status")) ?? new Set<string>();
		if (currentValues.size && sameValues(currentValues, selectedValues)) return;

		const params = new URLSearchParams(searchParams.toString());
		params.set("status", [...selectedValues].join(","));
		params.delete("page"); // a filter change starts again from page 1
		router.push(`/users?${params.toString()}`);
	}, [showActive, showInactive, showUnverified]);

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
