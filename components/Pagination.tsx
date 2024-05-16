"use client";
import { ChevronLeftIcon, ChevronRightIcon, DoubleArrowLeftIcon, DoubleArrowRightIcon } from "@radix-ui/react-icons";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "./ui/button";

interface Props {
	itemCount: number;
	pageSize: number;
	currentPage: number;
}

const Pagination = ({ itemCount, pageSize, currentPage }: Props) => {
	const route = useRouter();
	const searchParams = useSearchParams();

	const pageCount = Math.ceil(itemCount / pageSize);
	// if there is only one page, don't show pagination
	if (pageCount <= 1) return null;

	const changePage = (page: number) => {
		// get existing query params
		const params = new URLSearchParams(searchParams);
		// set page query param
		params.set("page", page.toString());
		// push new query params to route
		route.push(`?${params.toString()}`);
	};

	return (
		<div className="flex justify-center my-1">
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
		</div>
	);
};

export default Pagination;
