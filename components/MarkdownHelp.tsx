"use client";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CircleHelp } from "lucide-react";

/**
 * Formatting cheatsheet for the description editor.
 *
 * Shows the rendered result next to the syntax rather than the syntax alone - most people
 * do not need to learn markdown, they just need to recognise what the toolbar did to their text.
 */

function Row({ name, syntax, children }: { name: string; syntax: string; children: React.ReactNode }) {
	return (
		<>
			<div className="text-xs font-medium">{name}</div>
			<code className="rounded bg-muted px-1 py-0.5 text-[11px] text-muted-foreground">{syntax}</code>
			<div className="text-sm">{children}</div>
		</>
	);
}

export default function MarkdownHelp() {
	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button type="button" variant="ghost" size="sm" className="h-9 w-9 shrink-0 p-0" title="Formatting help" aria-label="Formatting help">
					<CircleHelp className="h-4 w-4" />
				</Button>
			</PopoverTrigger>
			<PopoverContent align="end" className="w-80 max-w-[92vw]">
				<p className="mb-3 text-sm">
					Select your text and use the formatting buttons above. Hit <span className="font-medium">Preview</span> to see how it will look.
				</p>

				<div className="mb-1 text-xs font-medium text-muted-foreground">If you prefer to type it</div>
				<div className="grid grid-cols-[auto_auto_1fr] items-center gap-x-2.5 gap-y-1.5">
					<div className="text-[10px] uppercase tracking-wide text-muted-foreground">What</div>
					<div className="text-[10px] uppercase tracking-wide text-muted-foreground">Type</div>
					<div className="text-[10px] uppercase tracking-wide text-muted-foreground">Get</div>

					<Row name="Bold" syntax="**text**">
						<strong>text</strong>
					</Row>
					<Row name="Italic" syntax="*text*">
						<em>text</em>
					</Row>
					<Row name="Heading" syntax="## Title">
						<span className="text-base font-bold">Title</span>
					</Row>
					<Row name="Bullet list" syntax="- item">
						<span>• item</span>
					</Row>
					<Row name="Numbered list" syntax="1. item">
						<span>1. item</span>
					</Row>
					<Row name="Link" syntax="[text](url)">
						<span className="text-blue-600 underline">text</span>
					</Row>
					<Row name="Quote" syntax="> text">
						<span className="border-l-2 border-muted-foreground/40 pl-2 text-muted-foreground">text</span>
					</Row>
					<Row name="Code" syntax="`text`">
						<code className="rounded bg-muted px-1 py-0.5 text-xs">text</code>
					</Row>
				</div>

				<p className="mt-3 border-t pt-3 text-xs text-muted-foreground">
					To add a picture, paste or drag it straight into the box, or use the image button. Blank lines start a new paragraph.
				</p>
			</PopoverContent>
		</Popover>
	);
}
