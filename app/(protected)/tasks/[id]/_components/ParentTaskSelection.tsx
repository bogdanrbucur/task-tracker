"use client";

// Parent task picker on the task form. Only tasks without a parent of their own are ever offered -
// the eligible list itself is fetched server-side (getEligibleParentTasks), which also excludes
// finished tasks and ones this user cannot edit, so nothing client-side needs to re-check those
// rules; the server action re-validates on submit regardless.
//
// Rendered as a searchable combobox (same Popover + Command pattern as TaskUserFilter) because the
// eligible list can run to hundreds of open tasks. The search matches the task title and the task
// ID only.

import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown } from "lucide-react";
import { useState } from "react";
import type { EligibleParentTask } from "../../_actions/getEligibleParentTasks";

interface Props {
	tasks: EligibleParentTask[];
	defaultParentId?: number | null;
	onChange?: (parentId: number | null) => void;
}

export function ParentTaskSelection({ tasks, defaultParentId, onChange }: Props) {
	const [open, setOpen] = useState(false);
	const [parentId, setParentId] = useState<number | null>(defaultParentId ?? null);

	const selected = parentId != null ? tasks.find((task) => task.id === parentId) : undefined;

	function handleSelect(next: number | null) {
		setParentId(next);
		onChange?.(next);
		setOpen(false);
	}

	return (
		<>
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					<Button variant="outline" role="combobox" aria-expanded={open} className={cn("w-full justify-between font-normal", !selected && "text-muted-foreground")}>
						<span className="truncate">{selected ? `#${selected.id} - ${selected.title}` : "No parent task"}</span>
						<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
					</Button>
				</PopoverTrigger>
				<PopoverContent align="start" className="w-[--radix-popover-trigger-width] p-0">
					<Command
						filter={(value, search) => (value.toLowerCase().includes(search.toLowerCase().trim()) ? 1 : 0)}
					>
						<CommandInput placeholder="Search by title or ID..." />
						<CommandList>
							<CommandEmpty>No task found.</CommandEmpty>
							<CommandGroup>
								<CommandItem value="none" onSelect={() => handleSelect(null)}>
									<Check className={cn("mr-2 h-4 w-4 shrink-0", parentId == null ? "opacity-100" : "opacity-0")} />
									No parent task
								</CommandItem>
								{tasks.map((task) => (
									<CommandItem key={task.id} value={`${task.id} ${task.title}`} onSelect={() => handleSelect(task.id === parentId ? null : task.id)}>
										<Check className={cn("mr-2 h-4 w-4 shrink-0", parentId === task.id ? "opacity-100" : "opacity-0")} />
										<span className="truncate">
											#{task.id} - {task.title}
										</span>
									</CommandItem>
								))}
							</CommandGroup>
						</CommandList>
					</Command>
				</PopoverContent>
			</Popover>
			<input type="hidden" name="parentId" value={parentId ?? ""} />
		</>
	);
}
