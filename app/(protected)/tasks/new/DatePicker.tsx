"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import * as React from "react";

export function DatePicker({ defaultDate, onChange }: { defaultDate?: Date; onChange: (date: Date | null) => void }) {
	const [date, setDate] = React.useState<Date | null>(defaultDate ?? null);

	// Set the default date as the return from the compoennt, if it is provided
	React.useEffect(() => {
		if (defaultDate) handleOnChange(defaultDate);
	}, [defaultDate]);

	function handleOnChange(date: Date | null | undefined) {
		if (date === undefined) date = null;
		setDate(date);
		onChange(date ? date : null);
	}

	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button variant={"outline"} className={cn("max-w-prose justify-start text-left font-normal", !date && "text-muted-foreground")}>
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
