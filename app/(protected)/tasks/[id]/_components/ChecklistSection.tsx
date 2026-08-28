"use client";

// Detail-page checklist: tick/untick items inline. Adding/removing items happens on the edit page
// instead - see ChecklistEditor.tsx - since that changes the task's scope and belongs in its
// history, while ticking is a much lighter, more frequent action.

import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useState, useTransition } from "react";
import toggleChecklistItem from "../_actions/toggleChecklistItem";

// A client-safe reimplementation of lib/utilityFunctions.ts's formatDateWithTime. That module also
// pulls in Node-only server dependencies (fs-extra, next/headers) through other exports it re-uses,
// which breaks the client bundle for any component that imports even one unrelated helper from it.
function formatDateWithTime(date: Date) {
	const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
	return format(localDate, "dd MMM yyyy HH:mm");
}

export interface ChecklistItemView {
	id: number;
	text: string;
	done: boolean;
	completedAt: Date | null;
	completedBy: { firstName: string; lastName: string } | null;
}

export default function ChecklistSection({ items, canToggle }: { items: ChecklistItemView[]; canToggle: boolean }) {
	const [isPending, startTransition] = useTransition();
	const [error, setError] = useState<string | null>(null);

	if (items.length === 0) return null;

	function handleToggle(item: ChecklistItemView, checked: boolean) {
		const formData = new FormData();
		formData.set("itemId", String(item.id));
		formData.set("done", String(checked));
		startTransition(async () => {
			const result = await toggleChecklistItem(null, formData);
			setError(result?.message ?? null);
		});
	}

	return (
		<div className="space-y-2" data-testid="checklist-section">
			{error && <p className="text-sm text-destructive">{error}</p>}
			{items.map((item) => (
				// Everything stays on one line, even once completed: the attribution sits next to the
				// item text rather than below it, so ticking an item never grows the row. The item text
				// takes the truncation hit (ellipsis, full text on hover) if the two don't both fit - see
				// MAX_CHECKLIST_ITEM_LENGTH for why that's the exception rather than the rule.
				<div key={item.id} className="flex items-center gap-2" data-testid="checklist-item">
					<Checkbox
						checked={item.done}
						disabled={!canToggle || isPending}
						onCheckedChange={(checked) => handleToggle(item, checked === true)}
						className="shrink-0"
					/>
					<div className="flex min-w-0 flex-1 items-baseline gap-2">
						<span className={cn("min-w-0 flex-1 truncate", item.done && "line-through text-muted-foreground")} title={item.text}>
							{item.text}
						</span>
						{item.done && item.completedAt && item.completedBy && (
							<span className="text-xs text-muted-foreground shrink-0 whitespace-nowrap" data-testid="checklist-item-completed-by">
								{item.completedBy.firstName} completed on {formatDateWithTime(item.completedAt)}
							</span>
						)}
					</div>
				</div>
			))}
		</div>
	);
}
