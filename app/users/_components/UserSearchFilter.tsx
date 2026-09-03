"use client";
import { Input } from "@/components/ui/input";
import { SearchIcon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function UserSearchFilter() {
	const router = useRouter();
	const searchParams = useSearchParams();

	// Seed from the URL so a back-navigation (or a shared link) keeps the search term visible in
	// the field and does not clear the active filter.
	const initialSearch = searchParams.get("search") ?? "";

	const [search, setSearch] = useState(initialSearch);
	const inputRef = useRef<HTMLInputElement | null>(null); // To store the reference to the input element
	const timeoutId = useRef<NodeJS.Timeout | null>(null); // To store the timeout ID

	// Track the last applied search value (prevents unnecessary URL updates). Seeded with the URL
	// value so the mount pass is a no-op and does not re-push the same URL (which would drop the
	// `page` param on a back-navigation).
	const lastSearch = useRef<string>(initialSearch);

	// Update the URL when the search value changes
	useEffect(() => {
		// Clear the previous timeout if it exists
		if (timeoutId.current) clearTimeout(timeoutId.current);

		// Set a new timeout
		timeoutId.current = setTimeout(() => {
			// Prevent unnecessary updates if the search value hasn't changed
			if (lastSearch.current === search) return;

			// Preserve existing search parameters while updating the search query
			const params = new URLSearchParams(searchParams.toString());

			if (search !== "") params.set("search", search);
			else params.delete("search");
			params.delete("page"); // a changed search starts again from page 1

			const query = params.toString() ? "?" + params.toString() : "";
			router.push(`/users${query}`);

			lastSearch.current = search;
		}, 250); // 250ms delay

		return () => {
			if (timeoutId.current) clearTimeout(timeoutId.current);
		};
	}, [search, router, searchParams]);

	// Focus the search filter on and off with CMD/CTRL + K
	useEffect(() => {
		const down = (e: KeyboardEvent) => {
			if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
				e.preventDefault();
				// Focus the search filter
				inputRef.current?.focus();
			}

			if (e.key === "Escape") {
				// Unfocus the search filter
				inputRef.current?.blur();
			}
		};
		document.addEventListener("keydown", down);
		return () => document.removeEventListener("keydown", down);
	}, []);

	return (
		<div className="relative">
			<div className="absolute top-2 left-2 z-5 text-gray-400 dark:text-gray-500">
				<SearchIcon className="hidden md:block h-5 w-5" />
			</div>
			<Input
				ref={inputRef}
				type="text"
				defaultValue={initialSearch}
				placeholder={search ? "" : "Search..."}
				className="h-9 md:pl-9 pr-4 rounded-md borderbg-transparent "
				onChange={(e) => setSearch(e.target.value)}
			/>
			{!search && <kbd className="hidden md:block absolute right-2 top-1.5 px-2 rounded border bg-muted font-mono text-[14px] font-medium text-muted-foreground opacity-100">CTRL+K</kbd>}{" "}
		</div>
	);
}
