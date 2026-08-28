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
import { GripVertical, X } from "lucide-react";
import { useState } from "react";

export const MAX_CHECKLIST_ITEMS = 50;
export const MAX_CHECKLIST_ITEM_LENGTH = 200;

export interface ChecklistItemDraft {
	id?: number;
	text: string;
}

export default function ChecklistEditor({ defaultItems }: { defaultItems?: ChecklistItemDraft[] }) {
	const [items, setItems] = useState<ChecklistItemDraft[]>(defaultItems ?? []);
	const [draft, setDraft] = useState("");

	function addItem() {
		const text = draft.trim();
		if (!text || items.length >= MAX_CHECKLIST_ITEMS) return;
		setItems([...items, { text }]);
		setDraft("");
	}

	function removeItem(index: number) {
		setItems(items.filter((_, i) => i !== index));
	}

	function move(index: number, direction: -1 | 1) {
		const target = index + direction;
		if (target < 0 || target >= items.length) return;
		const next = [...items];
		[next[index], next[target]] = [next[target], next[index]];
		setItems(next);
	}

	return (
		<div className="space-y-2">
			<Label>Checklist {items.length > 0 && `(${items.length}/${MAX_CHECKLIST_ITEMS})`}</Label>
			<div className="space-y-1" data-testid="checklist-editor-items">
				{items.map((item, index) => (
					<div key={item.id ?? `new-${index}`} className="flex items-center gap-2" data-testid="checklist-editor-item">
						<GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
						<Input
							value={item.text}
							maxLength={MAX_CHECKLIST_ITEM_LENGTH}
							onChange={(e) => {
								const next = [...items];
								next[index] = { ...next[index], text: e.target.value };
								setItems(next);
							}}
						/>
						<Button type="button" variant="ghost" size="sm" onClick={() => move(index, -1)} disabled={index === 0} aria-label="Move up">
							↑
						</Button>
						<Button type="button" variant="ghost" size="sm" onClick={() => move(index, 1)} disabled={index === items.length - 1} aria-label="Move down">
							↓
						</Button>
						<Button type="button" variant="ghost" size="sm" onClick={() => removeItem(index)} aria-label="Remove item">
							<X className="h-4 w-4" />
						</Button>
					</div>
				))}
			</div>
			{items.length < MAX_CHECKLIST_ITEMS && (
				<div className="flex gap-2">
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
					<Button type="button" size="sm" onClick={addItem} disabled={!draft.trim()} data-testid="checklist-add-button">
						Add
					</Button>
				</div>
			)}
			{items.length >= MAX_CHECKLIST_ITEMS && <p className="text-sm text-muted-foreground">Maximum of {MAX_CHECKLIST_ITEMS} items reached.</p>}
			<input type="hidden" name="checklistItems" value={JSON.stringify(items.filter((i) => i.text.trim()))} />
		</div>
	);
}
