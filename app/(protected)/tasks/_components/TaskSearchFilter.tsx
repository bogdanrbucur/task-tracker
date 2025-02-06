"use client";

import { Input } from "@/components/ui/input";
import { SearchIcon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function TaskSearchFilter() {
	const router = useRouter();
	const searchParams = useSearchParams();

	// State for storing the current search input value
	const [search, setSearch] = useState("");

	// Reference to the search input field for programmatic focus
	const inputRef = useRef<HTMLInputElement | null>(null);

	// Reference to store the debounce timeout ID
	const timeoutId = useRef<NodeJS.Timeout | null>(null);

	// Reference to track the last applied search value (prevents unnecessary URL updates)
	const lastSearch = useRef<string>("");

	// Effect to handle search query changes and update the URL accordingly
	useEffect(() => {
		// Clear any previous timeout to avoid multiple API calls
		if (timeoutId.current) clearTimeout(timeoutId.current);

		// Set a new debounce timeout (300ms) to delay the request until typing stops
		timeoutId.current = setTimeout(() => {
			// Prevent unnecessary updates if the search value hasn't changed
			if (lastSearch.current === search) return;

			// Preserve existing search parameters while updating the search query
			const params = new URLSearchParams(searchParams.toString());

			// If there's a search term, update the URL; otherwise, remove the search param
			if (search) {
				params.set("search", search);
			} else {
				params.delete("search");
			}

			// Construct the final query string and update the URL
			const query = params.toString() ? `?${params.toString()}` : "";
			router.push(`/tasks${query}`);

			// Store the last applied search value to prevent redundant updates
			lastSearch.current = search;
		}, 400); // Debounce delay

		// Cleanup function: Clears timeout on component unmount or state change
		return () => {
			if (timeoutId.current) clearTimeout(timeoutId.current);
		};
	}, [search, router, searchParams]);

	// Effect to add keyboard shortcuts for focusing/unfocusing the search field
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			// CMD+K or CTRL+K focuses the search input
			if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
				e.preventDefault();
				inputRef.current?.focus();
			}
			// ESC key unfocuses the search input
			if (e.key === "Escape") {
				inputRef.current?.blur();
			}
		};

		// Add event listener for keyboard shortcuts
		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, []);

	return (
		<div className="relative">
			{/* Search icon positioned inside the input field */}
			<div className="absolute top-2 left-2 z-5 text-gray-400 dark:text-gray-500">
				<SearchIcon className="hidden md:block h-5 w-5" />
			</div>

			{/* Search input field with debounce-based filtering */}
			<Input
				ref={inputRef}
				type="text"
				placeholder={search ? "" : "Search..."}
				className="h-9 md:pl-9 pr-4 rounded-md border bg-transparent"
				onChange={(e) => setSearch(e.target.value)}
			/>

			{/* Display a keyboard shortcut hint (CTRL+K) when the search field is empty */}
			{!search && (
				<kbd className="hidden md:block absolute right-2 top-1.5 px-2 rounded border bg-muted font-mono text-[14px] font-medium text-muted-foreground opacity-100">
					CTRL+K
				</kbd>
			)}
		</div>
	);
}
