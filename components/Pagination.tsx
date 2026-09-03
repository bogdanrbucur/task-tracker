"use client";
import { ChevronLeftIcon, ChevronRightIcon, DoubleArrowLeftIcon, DoubleArrowRightIcon } from "@radix-ui/react-icons";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

interface Props {
	itemCount: number;
	pageSize: number;
	currentPage: number;
	// When provided, a "rows per page" picker is shown next to the page buttons and writes the
	// choice to the `pageSize` URL param. The first entry is treated as the default and is kept
	// out of the URL. Omit the prop for a plain pager with a fixed page size.
	pageSizeOptions?: readonly number[];
}

const Pagination = ({ itemCount, pageSize, currentPage, pageSizeOptions }: Props) => {
	const route = useRouter();
	const searchParams = useSearchParams();

	const pageCount = Math.ceil(itemCount / pageSize);
	// Nothing to show: single page and no size picker to offer.
	if (pageCount <= 1 && !pageSizeOptions) return null;

	const changePage = (page: number) => {
		// get existing query params
		const params = new URLSearchParams(searchParams);
		// set page query param
		params.set("page", page.toString());
		// push new query params to route
		route.push(`?${params.toString()}`);
	};

	const changePageSize = (value: string) => {
		const params = new URLSearchParams(searchParams);
		// Keep the default out of the URL; store any other choice explicitly.
		if (pageSizeOptions && Number(value) === pageSizeOptions[0]) params.delete("pageSize");
		else params.set("pageSize", value);
		// A different page size shifts every row boundary - start again from page 1.
		params.delete("page");
		route.push(`?${params.toString()}`);
	};

	return (
		// Three-track grid: an empty left spacer mirrors the right-hand selector so the page
		// controls in the centre track sit centred across the full width, while the selector
		// stays pinned to the right rather than the whole row being centred as a unit.
		<div className="grid grid-cols-[1fr_auto_1fr] items-center gap-x-2 my-1">
			<div />
			{/* Page controls hide when everything fits on one page, but the size picker stays so the
			    user can always switch back to a smaller page. */}
			<div className="flex items-center justify-center">
				{pageCount > 1 && (
					<>
						<Button className="m-1" size="sm" variant="outline" disabled={currentPage === 1} onClick={() => changePage(1)}>
							<DoubleArrowLeftIcon />
						</Button>
						<Button className="m-1" size="sm" variant="outline" disabled={currentPage === 1} onClick={() => changePage(currentPage - 1)}>
							<ChevronLeftIcon />
						</Button>
						<div className="text-xs content-center m-1">
							Page {currentPage} of {pageCount}
						</div>
						<Button className="m-1" size="sm" variant="outline" disabled={currentPage === pageCount} onClick={() => changePage(currentPage + 1)}>
							<ChevronRightIcon />
						</Button>
						<Button className="m-1" size="sm" variant="outline" disabled={currentPage === pageCount} onClick={() => changePage(pageCount)}>
							<DoubleArrowRightIcon />
						</Button>
					</>
				)}
			</div>
			<div className="flex justify-end">
				{pageSizeOptions && (
					<Select value={pageSize.toString()} onValueChange={changePageSize}>
						<SelectTrigger
							aria-label="Rows per page"
							className="m-1 h-9 w-auto gap-1 rounded-md border-input bg-background px-3 text-xs font-medium hover:bg-accent hover:text-accent-foreground focus:ring-0 focus:ring-offset-0"
						>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{pageSizeOptions.map((option) => (
								<SelectItem key={option} value={option.toString()} className="text-xs">
									{option} / page
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				)}
			</div>
		</div>
	);
};

export default Pagination;
