"use client";
import MarkdownHelp from "@/components/MarkdownHelp";
import RichText from "@/components/RichText";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MAX_DESCRIPTION_IMAGE_SIZE_BYTES, MAX_DESCRIPTION_IMAGE_SIZE_MB, MAX_DESCRIPTION_IMAGES, extractDescriptionImageIds } from "@/lib/richText";
import { cn } from "@/lib/utils";
import { Bold, Code, Eye, Heading, Image as ImageIcon, Italic, Link as LinkIcon, List, ListOrdered, Pencil, Strikethrough } from "lucide-react";
import { useRef, useState } from "react";

/**
 * Markdown editor over a real <textarea>, so the surrounding plain <form action={serverAction}>
 * keeps working and the native mobile keyboard behaves normally (no contenteditable).
 *
 * Preview renders through the same RichText component the task page uses, so the preview is
 * exactly what will be displayed.
 */

// Declared outside the component and keyed by name rather than by callback: storing ref-reading
// closures in an array built during render trips react-hooks/refs.
const TOOLS = [
	{ name: "bold", label: "Bold (Ctrl/⌘ B)", icon: Bold },
	{ name: "italic", label: "Italic (Ctrl/⌘ I)", icon: Italic },
	{ name: "strikethrough", label: "Strikethrough", icon: Strikethrough },
	{ name: "heading", label: "Heading", icon: Heading },
	{ name: "link", label: "Link", icon: LinkIcon },
	{ name: "bulletedList", label: "Bulleted list", icon: List },
	{ name: "numberedList", label: "Numbered list", icon: ListOrdered },
	{ name: "code", label: "Code", icon: Code },
	{ name: "image", label: "Insert image", icon: ImageIcon },
] as const;

type ToolName = (typeof TOOLS)[number]["name"];
export default function MarkdownEditor({
	name,
	defaultValue = "",
	rows = 10,
	placeholder,
	maxLength,
}: {
	name: string;
	defaultValue?: string;
	rows?: number;
	placeholder?: string;
	maxLength?: number;
}) {
	const [value, setValue] = useState(defaultValue);
	const [isPreview, setIsPreview] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [uploading, setUploading] = useState(0);
	const [isDragging, setIsDragging] = useState(false);
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const uploadTokenRef = useRef(0);

	// Write into the textarea via execCommand so the browser's native undo stack (Ctrl/Cmd+Z)
	// keeps working. Assigning to .value directly would silently destroy it.
	const replaceSelection = (text: string, selectFrom?: number, selectTo?: number) => {
		const textarea = textareaRef.current;
		if (!textarea) return;

		textarea.focus();
		document.execCommand("insertText", false, text);
		if (selectFrom !== undefined) textarea.setSelectionRange(selectFrom, selectTo ?? selectFrom);
		setValue(textarea.value);
	};

	// Wrap the selection (or insert a placeholder) with markers, e.g. **bold**
	const surround = (marker: string, placeholderText: string, endMarker = marker) => {
		const textarea = textareaRef.current;
		if (!textarea) return;

		const { selectionStart, selectionEnd } = textarea;
		const selected = textarea.value.slice(selectionStart, selectionEnd) || placeholderText;
		replaceSelection(`${marker}${selected}${endMarker}`, selectionStart + marker.length, selectionStart + marker.length + selected.length);
	};

	// Prefix every selected line, e.g. "- " for a bullet list
	const prefixLines = (prefix: string | ((index: number) => string)) => {
		const textarea = textareaRef.current;
		if (!textarea) return;

		const { value: current, selectionStart, selectionEnd } = textarea;
		// Expand the selection out to whole lines so we prefix from the true line start
		const lineStart = current.lastIndexOf("\n", selectionStart - 1) + 1;
		const lineEndIndex = current.indexOf("\n", selectionEnd);
		const lineEnd = lineEndIndex === -1 ? current.length : lineEndIndex;

		const prefixed = current
			.slice(lineStart, lineEnd)
			.split("\n")
			.map((line, index) => `${typeof prefix === "string" ? prefix : prefix(index)}${line}`)
			.join("\n");

		textarea.focus();
		textarea.setSelectionRange(lineStart, lineEnd);
		replaceSelection(prefixed, lineStart, lineStart + prefixed.length);
	};

	const insertLink = () => {
		const textarea = textareaRef.current;
		if (!textarea) return;

		const { selectionStart, selectionEnd } = textarea;
		const selected = textarea.value.slice(selectionStart, selectionEnd);
		const looksLikeUrl = /^(https?:\/\/|mailto:)/i.test(selected.trim());

		if (looksLikeUrl) {
			// Selected a URL - keep it as the target and put the caret on the label
			replaceSelection(`[text](${selected.trim()})`, selectionStart + 1, selectionStart + 5);
		} else {
			const label = selected || "link text";
			replaceSelection(`[${label}](url)`, selectionStart + label.length + 3, selectionStart + label.length + 6);
		}
	};

	const uploadImage = async (file: File) => {
		if (!file.type.startsWith("image/")) {
			setError("Only image files can be embedded in the description.");
			return;
		}
		if (file.size > MAX_DESCRIPTION_IMAGE_SIZE_BYTES) {
			setError(`Image must not exceed ${MAX_DESCRIPTION_IMAGE_SIZE_MB} MB.`);
			return;
		}
		if (extractDescriptionImageIds(value).length + uploading >= MAX_DESCRIPTION_IMAGES) {
			setError(`You can embed at most ${MAX_DESCRIPTION_IMAGES} images in a description.`);
			return;
		}

		setError(null);
		setUploading((count) => count + 1);

		// Drop in a visible placeholder straight away, then swap it once the upload lands.
		// A counter rather than a random id keeps this deterministic and uniquely identifies
		// the placeholder even when the same filename is uploaded twice.
		uploadTokenRef.current += 1;
		const token = `![uploading ${file.name}…](#upload-${uploadTokenRef.current})`;
		replaceSelection(token);

		try {
			const formData = new FormData();
			formData.append("file", file);

			const response = await fetch("/api/description-images", { method: "POST", body: formData });
			const data = await response.json();
			if (!response.ok) throw new Error(data?.error || response.statusText);

			const alt = file.name.replace(/\.[^.]+$/, "");
			setValue((current) => current.replace(token, `![${alt}](${data.url})`));
		} catch (err) {
			setValue((current) => current.replace(token, ""));
			setError(`Could not upload ${file.name}: ${err instanceof Error ? err.message : err}`);
		} finally {
			setUploading((count) => count - 1);
		}
	};

	const uploadFiles = (files: FileList | File[]) => {
		for (const file of Array.from(files)) {
			if (file.type.startsWith("image/")) void uploadImage(file);
		}
	};

	const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (!(event.metaKey || event.ctrlKey)) return;
		const key = event.key.toLowerCase();
		if (key === "b") {
			event.preventDefault();
			surround("**", "bold text");
		} else if (key === "i") {
			event.preventDefault();
			surround("*", "italic text");
		}
	};

	const applyTool = (tool: ToolName) => {
		switch (tool) {
			case "bold":
				return surround("**", "bold text");
			case "italic":
				return surround("*", "italic text");
			case "strikethrough":
				return surround("~~", "struck text");
			case "heading":
				return prefixLines("## ");
			case "link":
				return insertLink();
			case "bulletedList":
				return prefixLines("- ");
			case "numberedList":
				return prefixLines((index) => `${index + 1}. `);
			case "code":
				return surround("`", "code");
			case "image":
				return fileInputRef.current?.click();
		}
	};

	return (
		<div className="rounded-md border border-input">
			<div className="flex items-center justify-between gap-2 border-b border-input px-1 py-1">
				{/* Scrolls horizontally rather than wrapping on narrow screens */}
				<div className="flex items-center gap-0.5 overflow-x-auto">
					{TOOLS.map((tool) => (
						<Button
							key={tool.name}
							type="button"
							variant="ghost"
							size="sm"
							title={tool.label}
							aria-label={tool.label}
							disabled={isPreview}
							onClick={() => applyTool(tool.name)}
							className="h-9 w-9 shrink-0 p-0"
						>
							<tool.icon className="h-4 w-4" />
						</Button>
					))}
				</div>
				<div className="flex shrink-0 items-center">
					<MarkdownHelp />
					<Button
						type="button"
						variant="ghost"
						size="sm"
						className="h-9 shrink-0 gap-1 px-2"
						onClick={() => setIsPreview((previewing) => !previewing)}
						aria-label={isPreview ? "Edit description" : "Preview description"}
					>
						{isPreview ? <Pencil className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
						<span className="hidden sm:inline">{isPreview ? "Write" : "Preview"}</span>
					</Button>
				</div>
			</div>

			{/* The textarea always stays mounted (only hidden) so the form always submits its value */}
			<div className={cn(isPreview && "hidden")}>
				<Textarea
					ref={textareaRef}
					name={name}
					rows={rows}
					placeholder={placeholder}
					maxLength={maxLength}
					value={value}
					onChange={(event) => setValue(event.target.value)}
					onKeyDown={handleKeyDown}
					onPaste={(event) => {
						if (event.clipboardData.files.length > 0) {
							event.preventDefault();
							uploadFiles(event.clipboardData.files);
						}
					}}
					onDragOver={(event) => {
						event.preventDefault();
						setIsDragging(true);
					}}
					onDragLeave={() => setIsDragging(false)}
					onDrop={(event) => {
						setIsDragging(false);
						if (event.dataTransfer.files.length > 0) {
							event.preventDefault();
							uploadFiles(event.dataTransfer.files);
						}
					}}
					className={cn("resize-y rounded-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0", isDragging && "bg-accent")}
				/>
			</div>

			{isPreview && (
				<div className="px-3 py-2 min-h-[80px]">
					{value.trim() ? <RichText source={value} /> : <p className="text-sm text-muted-foreground">Nothing to preview yet.</p>}
				</div>
			)}

			<div className="flex items-center justify-between gap-2 border-t border-input px-3 py-1.5 text-xs text-muted-foreground">
				<span>{uploading > 0 ? `Uploading ${uploading} image${uploading > 1 ? "s" : ""}…` : "Select text and use the buttons above to format it. Paste or drag in images."}</span>
				{maxLength && (
					<span className={cn("shrink-0 tabular-nums", value.length > maxLength * 0.9 && "text-orange-600 dark:text-orange-400")}>
						{value.length}/{maxLength}
					</span>
				)}
			</div>

			{error && <p className="border-t border-input px-3 py-1.5 text-xs text-destructive">{error}</p>}

			<input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(event) => {
				if (event.target.files) uploadFiles(event.target.files);
				event.target.value = "";
			}} />
		</div>
	);
}
