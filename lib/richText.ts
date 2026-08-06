// Shared helpers for images embedded inline in task descriptions.
// Images are stored outside of public/ under FILES_PATH and served through the
// auth-gated /api/description-images/[id] route.

// Raised from 4096 when descriptions became markdown - syntax and image URLs consume real budget
export const MAX_DESCRIPTION_LENGTH = 16384;
export const MIN_DESCRIPTION_LENGTH = 20;

export const MAX_DESCRIPTION_IMAGE_SIZE_MB = 5;
export const MAX_DESCRIPTION_IMAGE_SIZE_BYTES = MAX_DESCRIPTION_IMAGE_SIZE_MB * 1024 * 1024;
export const MAX_DESCRIPTION_IMAGES = 10;

// Longest edge an uploaded image is downscaled to before being stored as WebP
export const DESCRIPTION_IMAGE_MAX_DIMENSION = 1600;

export const DESCRIPTION_IMAGE_URL_PREFIX = "/api/description-images/";

export function descriptionImageUrl(id: string) {
	return `${DESCRIPTION_IMAGE_URL_PREFIX}${id}`;
}

// Ids are UUIDs, so match conservatively rather than accepting anything.
const DESCRIPTION_IMAGE_REFERENCE = /\/api\/description-images\/([0-9a-fA-F-]{36})/g;

// Collect the distinct image ids a markdown description references.
export function extractDescriptionImageIds(description: string): string[] {
	const ids = new Set<string>();
	for (const match of description.matchAll(DESCRIPTION_IMAGE_REFERENCE)) ids.add(match[1]);
	return [...ids];
}

/**
 * Flatten markdown to readable plain text, for surfaces that cannot render it - currently the
 * Excel export. Deliberately a light-touch strip rather than a full parse: the goal is a legible
 * cell, not a faithful conversion.
 */
export function markdownToPlainText(markdown: string): string {
	return (
		markdown
			// Images: drop them, keeping the alt text if there is any
			.replace(/!\[([^\]]*)\]\([^)]*\)/g, (_, alt) => alt || "")
			// Links: "label (url)", or just the url when the label is the url
			.replace(/\[([^\]]*)\]\(([^)]*)\)/g, (_, label, url) => (label && label !== url ? `${label} (${url})` : url))
			// Fenced code blocks: keep the code, drop the fences
			.replace(/^```[^\n]*\n?/gm, "")
			// Heading, blockquote and list markers at the start of a line
			.replace(/^\s{0,3}(#{1,6}\s+|>\s?|[-*+]\s+)/gm, "")
			// Emphasis and inline code markers
			.replace(/(\*\*|__|~~|`)/g, "")
			.replace(/(^|\W)[*_]([^*_\n]+)[*_](\W|$)/g, "$1$2$3")
			// Horizontal rules
			.replace(/^\s*([-*_])\s*\1\s*\1[\s\-*_]*$/gm, "")
			// Collapse the blank lines the above may leave behind
			.replace(/\n{3,}/g, "\n\n")
			.trim()
	);
}
