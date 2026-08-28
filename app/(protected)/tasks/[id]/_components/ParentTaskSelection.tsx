"use client";

// Parent task picker on the task form. Only tasks without a parent of their own are ever offered -
// the eligible list itself is fetched server-side (getEligibleParentTasks), which also excludes
// finished tasks and ones this user cannot edit, so nothing client-side needs to re-check those
// rules; the server action re-validates on submit regardless.

import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import type { EligibleParentTask } from "../../_actions/getEligibleParentTasks";

interface Props {
	tasks: EligibleParentTask[];
	defaultParentId?: number | null;
	onChange?: (parentId: number | null) => void;
}

export function ParentTaskSelection({ tasks, defaultParentId, onChange }: Props) {
	const [parentId, setParentId] = useState<string>(defaultParentId ? String(defaultParentId) : "none");

	function handleChange(value: string) {
		setParentId(value);
		onChange?.(value === "none" ? null : Number(value));
	}

	return (
		<>
			<Select value={parentId} onValueChange={handleChange}>
				<SelectTrigger className="max-w-prose">
					<SelectValue placeholder="No parent task" />
				</SelectTrigger>
				<SelectContent>
					<SelectGroup>
						<SelectItem value="none">No parent task</SelectItem>
						{tasks.map((task) => (
							<SelectItem key={task.id} value={String(task.id)}>
								#{task.id} - {task.title}
							</SelectItem>
						))}
					</SelectGroup>
				</SelectContent>
			</Select>
			<input type="hidden" name="parentId" value={parentId === "none" ? "" : parentId} />
		</>
	);
}
