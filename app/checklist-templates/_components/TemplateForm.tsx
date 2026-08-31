"use client";

import ChecklistEditor, { ChecklistItemDraft } from "@/app/(protected)/tasks/[id]/_components/ChecklistEditor";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import saveTemplate from "../_actions/saveTemplate";

const initialState = { message: null, success: undefined };

interface Props {
	template?: { id: number; name: string; items: ChecklistItemDraft[] };
}

export default function TemplateForm({ template }: Props) {
	const isEditing = !!template;
	const [state, formAction] = useActionState(saveTemplate, initialState);

	useEffect(() => {
		if (state?.success) window.location.assign("/checklist-templates");
	}, [state?.success]);

	return (
		<Card className="container mx-auto max-w-2xl px-3 py-3 md:px-8 md:py-6">
			<h1 className="mb-4 text-2xl font-bold md:mb-8 md:text-3xl">{isEditing ? "Edit checklist template" : "New checklist template"}</h1>
			<form className="space-y-4" action={formAction}>
				{isEditing && <input type="hidden" name="id" value={template.id} />}
				<div className="space-y-2">
					<Label htmlFor="name">Template name</Label>
					<Input id="name" name="name" placeholder="e.g. Vessel checks" defaultValue={template?.name} required />
				</div>

				<ChecklistEditor name="items" labelText="Checklist items" optional={false} defaultItems={template?.items} />

				{state?.message && (
					<Alert variant="destructive">
						<AlertCircle className="h-4 w-4" />
						<AlertTitle>Template could not be saved</AlertTitle>
						<AlertDescription>{state.message}</AlertDescription>
					</Alert>
				)}

				<div className="flex justify-between">
					<Button asChild variant="outline">
						<Link href="/checklist-templates">Cancel</Link>
					</Button>
					<SubmitButton isEditing={isEditing} />
				</div>
			</form>
		</Card>
	);
}

function SubmitButton({ isEditing }: { isEditing: boolean }) {
	const { pending } = useFormStatus();
	return (
		<Button type="submit" disabled={pending}>
			{pending ? "Saving..." : isEditing ? "Save template" : "Create template"}
		</Button>
	);
}
