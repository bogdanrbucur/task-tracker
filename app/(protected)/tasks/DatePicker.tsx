"use client";

import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export function DatePicker({ onChange }: { onChange: (date: Date | null) => void }) {
	const [date, setDate] = React.useState<Date | null>();

	function handleOnChange(date: Date | null | undefined) {
		// if (date === undefined) date = null;
		setDate(date);
		onChange(date ? date : null);
	}

	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button variant={"outline"} className={cn("w-[250px] justify-start text-left font-normal", !date && "text-muted-foreground")}>
					<CalendarIcon className="mr-2 h-4 w-4" />
					{date ? format(date, "dd MMM yyyy") : <span>Pick a date</span>}
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-auto p-0">
				<Calendar weekStartsOn={1} mode="single" selected={date ? date : undefined} onSelect={handleOnChange} initialFocus />
			</PopoverContent>
		</Popover>
	);
}
