"use client";

// Add/remove/reorder checklist items on the task form (new or edit). Ticking/unticking happens
// separately, on the detail page - see ChecklistSection.tsx - since that is a much lighter action
// available to a slightly different set of people (see canToggleChecklist).
//
// The full item list (with each existing item's id, so ticked state on untouched items survives an
// edit - see syncChecklistItems) is serialised into one hidden "checklistItems" field as JSON,
// which is how a plain <form action={serverAction}> submits structured data.

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { GripVertical, X } from "lucide-react";
import { useState } from "react";

export const MAX_CHECKLIST_ITEMS = 50;
// Mirrors checklistShared.ts's MAX_CHECKLIST_ITEM_LENGTH - see the comment there for why it's short.
// Can't import it directly: checklistShared.ts pulls in the Prisma client, which breaks this
// client bundle.
export const MAX_CHECKLIST_ITEM_LENGTH = 80;

export interface ChecklistItemDraft {
	id?: number;
	text: string;
}

export default function ChecklistEditor({ defaultItems }: { defaultItems?: ChecklistItemDraft[] }) {
	const [items, setItems] = useState<ChecklistItemDraft[]>(defaultItems ?? []);
	const [draft, setDraft] = useState("");
	// Native HTML5 drag-and-drop, not a library: this is a single flat list with one drag handle per
	// row, which the browser's own drag events cover without pulling in a dependency for it.
	const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
	const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

	function addItem() {
		const text = draft.trim();
		if (!text || items.length >= MAX_CHECKLIST_ITEMS) return;
		setItems([...items, { text }]);
		setDraft("");
	}

	function removeItem(index: number) {
		setItems(items.filter((_, i) => i !== index));
	}

	function reorder(targetIndex: number) {
		if (draggedIndex === null || draggedIndex === targetIndex) return;
		const next = [...items];
		const [moved] = next.splice(draggedIndex, 1);
		next.splice(targetIndex, 0, moved);
		setItems(next);
	}

	return (
		<div className="space-y-2">
			<Label>Checklist {items.length > 0 && `(${items.length}/${MAX_CHECKLIST_ITEMS})`}</Label>
			<div className="space-y-1" data-testid="checklist-editor-items">
				{items.map((item, index) => (
					<div
						key={item.id ?? `new-${index}`}
						className={cn(
							"flex items-center gap-2 rounded-md",
							draggedIndex === index && "opacity-40",
							dragOverIndex === index && draggedIndex !== null && draggedIndex !== index && "bg-muted/50"
						)}
						data-testid="checklist-editor-item"
						onDragOver={(e) => {
							e.preventDefault();
							if (draggedIndex !== null) setDragOverIndex(index);
						}}
						onDragLeave={() => setDragOverIndex((current) => (current === index ? null : current))}
						onDrop={(e) => {
							e.preventDefault();
							reorder(index);
							setDraggedIndex(null);
							setDragOverIndex(null);
						}}
					>
						<span
							className="shrink-0 cursor-grab active:cursor-grabbing"
							draggable
							onDragStart={(e) => {
								setDraggedIndex(index);
								e.dataTransfer.effectAllowed = "move";
							}}
							onDragEnd={() => {
								setDraggedIndex(null);
								setDragOverIndex(null);
							}}
							aria-label="Drag to reorder"
						>
							<GripVertical className="h-4 w-4 text-muted-foreground" />
						</span>
						<Input
							value={item.text}
							maxLength={MAX_CHECKLIST_ITEM_LENGTH}
							onChange={(e) => {
								const next = [...items];
								next[index] = { ...next[index], text: e.target.value };
								setItems(next);
							}}
						/>
						<Button type="button" variant="ghost" size="sm" className="w-16" onClick={() => removeItem(index)} aria-label="Remove item">
							<X className="h-4 w-4" />
						</Button>
					</div>
				))}
			</div>
			{items.length < MAX_CHECKLIST_ITEMS && (
				<div className="flex items-center gap-2">
					{/* Matches the drag handle's footprint above (h-4 w-4, same gap-2) so this input's left
					    edge lines up with the existing items' inputs instead of starting further left. */}
					<span className="h-4 w-4 shrink-0" aria-hidden="true" />
					<Input
						placeholder="Add a checklist item (e.g. a vessel name)"
						value={draft}
						maxLength={MAX_CHECKLIST_ITEM_LENGTH}
						onChange={(e) => setDraft(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter") {
								e.preventDefault();
								addItem();
							}
						}}
					/>
					<Button type="button" size="sm" className="w-16" onClick={addItem} disabled={!draft.trim()} data-testid="checklist-add-button">
						Add
					</Button>
				</div>
			)}
			{items.length >= MAX_CHECKLIST_ITEMS && <p className="text-sm text-muted-foreground">Maximum of {MAX_CHECKLIST_ITEMS} items reached.</p>}
			<input type="hidden" name="checklistItems" value={JSON.stringify(items.filter((i) => i.text.trim()))} />
		</div>
	);
}
