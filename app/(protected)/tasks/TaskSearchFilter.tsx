"use client";
import { Input } from "@/components/ui/input";
import { SearchIcon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function TaskSearchFilter() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [search, setSearch] = useState("");
	const inputRef = useRef<HTMLInputElement | null>(null); // To store the reference to the input element
	const timeoutId = useRef<NodeJS.Timeout | null>(null); // To store the timeout ID

	// Update the URL when the selected userId changes
	useEffect(() => {
		// Clear the previous timeout if it exists
		if (timeoutId.current) clearTimeout(timeoutId.current);

		// Set a new timeout
		timeoutId.current = setTimeout(() => {
			const params = new URLSearchParams();
			// Add the existing searchPramas to the URL
			if (searchParams.get("orderBy")) params.append("orderBy", searchParams.get("orderBy")!);
			if (searchParams.get("sortOrder")) params.append("sortOrder", searchParams.get("sortOrder")!);
			if (searchParams.get("user")) params.append("user", searchParams.get("user")!);
			if (searchParams.get("status")) params.append("status", searchParams.get("status")!);

			// Add the selected search to the URL
			if (search !== "") params.append("search", search);
			if (search === "") params.delete("search");

			const query = params.toString() ? "?" + params.toString() : "";
			router.push(`/tasks${query}`);
		}, 250); // 250ms delay
	}, [search]);

	// Focus the search filter on and off with CMD/CTRL + K
	useEffect(() => {
		const down = (e: KeyboardEvent) => {
			if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
				e.preventDefault();
				// Focus the search filter
				inputRef.current?.focus();
			}
		};
		document.addEventListener("keydown", down);
		return () => document.removeEventListener("keydown", down);
	}, []);

	return (
		<div className="relative">
			<div className="absolute top-2 left-2 z-10 text-gray-400 dark:text-gray-500">
				<SearchIcon className="h-5 w-5" />
			</div>
			<Input
				ref={inputRef}
				type="text"
				placeholder={search ? "" : "Search..."}
				className="h-9 pl-9 pr-4 rounded-md borderbg-transparent "
				onChange={(e) => setSearch(e.target.value)}
			/>
			{!search && (
				<kbd className="absolute right-2 top-1.5 px-2 py-1 rounded border bg-muted font-mono text-[10px] font-medium text-muted-foreground opacity-100">CTRL+K</kbd>
			)}{" "}
		</div>
	);
}
