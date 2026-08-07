import { diffWords } from "diff";

export type DescriptionDiffPart = { value: string; added?: boolean; removed?: boolean };
export type DescriptionDiffPayload = { type: "description-diff"; editor: string; parts: DescriptionDiffPart[] };

const MAX_CONTEXT_WORDS = 25; // fallback cap for a single pathologically long paragraph
const MAX_CHUNK_CHARS = 1000;
const PARAGRAPH_BREAK = /\n{2,}/;

// Descriptions can carry \r\n (e.g. pasted from Windows sources) while PARAGRAPH_BREAK only
// matches bare \n\n - without this, a \r\n\r\n break is invisible to the paragraph splitter and
// the whole text is treated as a single paragraph.
function normalizeLineEndings(value: string): string {
	return value.replace(/\r\n?/g, "\n");
}

function truncateChunk(value: string): string {
	if (value.length <= MAX_CHUNK_CHARS) return value;
	return `${value.slice(0, MAX_CHUNK_CHARS)}… (${value.length - MAX_CHUNK_CHARS} more characters)`;
}

function capWords(value: string, edge: "head" | "tail"): string {
	const words = value.split(" ");
	if (words.length <= MAX_CONTEXT_WORDS) return value;
	return edge === "head" ? words.slice(0, MAX_CONTEXT_WORDS).join(" ") : words.slice(-MAX_CONTEXT_WORDS).join(" ");
}

// Scope an unchanged stretch of text down to the paragraph(s) adjacent to the surrounding
// change(s), the same way a diff hunk shows a few context lines rather than the whole file.
// `position` says which side(s) of this stretch actually border a change:
//  - "beforeChange": a change follows immediately - keep only its last paragraph (context leading into it)
//  - "afterChange": a change precedes it - keep only its first paragraph (context trailing out of it)
//  - "betweenChanges": changes on both sides - keep the first and last paragraph, drop everything between
function scopeToParagraph(value: string, position: "beforeChange" | "afterChange" | "betweenChanges"): string {
	const paragraphs = value.split(PARAGRAPH_BREAK);

	if (position === "beforeChange") return capWords(paragraphs[paragraphs.length - 1], "tail");
	if (position === "afterChange") return capWords(paragraphs[0], "head");

	if (paragraphs.length === 1) {
		const words = paragraphs[0].split(" ");
		if (words.length <= MAX_CONTEXT_WORDS * 2 + 1) return paragraphs[0];
		return `${capWords(paragraphs[0], "head")} … ${capWords(paragraphs[0], "tail")}`;
	}
	return `${capWords(paragraphs[0], "head")} … ${capWords(paragraphs[paragraphs.length - 1], "tail")}`;
}

// Encode a description edit as a compact word-level diff rather than storing both full bodies:
// descriptions are markdown and can run to 16k characters, so unchanged context is scoped down to
// the paragraph(s) bordering each change, keeping the stored entry proportional to the actual edit.
export function formatDescriptionChange(oldDescription: string, newDescription: string, editor: string): string {
	const rawParts = diffWords(normalizeLineEndings(oldDescription ?? ""), normalizeLineEndings(newDescription ?? ""));

	const parts: DescriptionDiffPart[] = rawParts.map((part, index) => {
		if (part.added || part.removed) return { value: truncateChunk(part.value), added: part.added, removed: part.removed };

		const changeBefore = index > 0;
		const changeAfter = index < rawParts.length - 1;
		const position = changeBefore && changeAfter ? "betweenChanges" : changeAfter ? "beforeChange" : "afterChange";

		return { value: scopeToParagraph(part.value, position) };
	});

	const payload: DescriptionDiffPayload = { type: "description-diff", editor, parts };
	return JSON.stringify(payload);
}

// Returns null for anything that isn't a diff-encoded entry - older plain-text history rows, or
// other change types (title, due date, assignee) that are still stored as plain strings.
export function parseDescriptionChange(raw: string): DescriptionDiffPayload | null {
	try {
		const parsed = JSON.parse(raw);
		if (parsed && parsed.type === "description-diff" && Array.isArray(parsed.parts)) return parsed as DescriptionDiffPayload;
	} catch {
		// Not JSON - a plain-text history entry
	}
	return null;
}
