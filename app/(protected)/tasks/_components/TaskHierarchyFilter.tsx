"use client";

// All tasks (default) / Hide sub-tasks - alongside the user and department filters. Follows the
// same URL-param pattern as TaskUserFilter: read the existing value, write the full set back
// (including hierarchy) whenever any of them change.

import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useRouter, useSearchParams } from "next/navigation";

const OPTIONS = [
	{ value: "all", label: "All tasks" },
	{ value: "hideSubtasks", label: "Hide sub-tasks" },
] as const;

export function TaskHierarchyFilter() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const current = searchParams.get("hierarchy") ?? "all";

	function handleChange(value: string) {
		const params = new URLSearchParams(searchParams.toString());
		if (value === "all") params.delete("hierarchy");
		else params.set("hierarchy", value);

		const query = params.toString() ? `?${params.toString()}` : "";
		router.push(`/tasks${query}`);
	}

	const label = OPTIONS.find((o) => o.value === current)?.label ?? "All tasks";

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="outline" size="sm">
					{label}
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent className="w-44">
				<DropdownMenuLabel>Sub-tasks</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuRadioGroup value={current} onValueChange={handleChange}>
					{OPTIONS.map((option) => (
						<DropdownMenuRadioItem key={option.value} value={option.value}>
							{option.label}
						</DropdownMenuRadioItem>
					))}
				</DropdownMenuRadioGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
