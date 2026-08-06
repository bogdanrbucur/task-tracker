// Server-only helpers for task attachments on disk.
//
// Attachment filenames come from the multipart body and are entirely attacker-controlled: Node's
// form parser preserves traversal sequences verbatim, so a filename of "../../../../foo" would
// escape the task's directory and let any signed-in user write anywhere the process can. Every
// path built from a filename must go through sanitizeAttachmentFilename() and isInsideDir().

import path from "path";

export const MAX_ATTACHMENT_SIZE_MB = 10;
export const MAX_ATTACHMENT_SIZE_BYTES = MAX_ATTACHMENT_SIZE_MB * 1024 * 1024;

// Leaves room for the "source_"/"completion_" prefix within a 255-byte filesystem limit
const MAX_FILENAME_LENGTH = 200;

/**
 * Reduce an uploaded filename to a single safe path segment, or null if nothing usable remains.
 * Rejects traversal, absolute paths, separators, control characters and dot-only names.
 */
export function sanitizeAttachmentFilename(rawName: string): string | null {
	if (typeof rawName !== "string") return null;

	// Normalise Windows separators first, then take the last segment - this is what defeats
	// "../../x", "/etc/x" and "C:\\windows\\x" alike
	const base = path.basename(rawName.replace(/\\/g, "/"));

	const cleaned = base
		// Strip control characters - these have no place in a filename
		.replace(/[\x00-\x1f\x7f]/g, "")
		.replace(/[/\\]/g, "")
		.trim();

	// "", ".", ".." and friends are not usable filenames
	if (!cleaned || /^\.+$/.test(cleaned)) return null;

	return cleaned.slice(0, MAX_FILENAME_LENGTH);
}

/** The directory a task's attachments live in. */
export function taskAttachmentsDir(taskId: number) {
	return `${process.env.FILES_PATH}/attachments/${taskId}`;
}

/**
 * Belt-and-braces containment check: true only if `candidate` resolves to something inside `dir`.
 * Guards against any traversal that survives sanitisation.
 */
export function isInsideDir(dir: string, candidate: string) {
	const resolvedDir = path.resolve(dir);
	const resolved = path.resolve(candidate);
	return resolved === resolvedDir || resolved.startsWith(resolvedDir + path.sep);
}

/**
 * Find the file on disk backing a stored Attachment.path.
 *
 * Prefers an exact match. Older rows were written before filenames were sanitised, and the routes
 * used to locate them with a substring match - which could also serve the wrong file when one
 * attachment name was a substring of another. The fallback keeps those legacy rows readable
 * without reintroducing the ambiguity for anything written from now on.
 */
export function findAttachmentFile(files: string[], storedPath: string): string | undefined {
	const exact = files.find((file) => file === storedPath);
	if (exact) return exact;
	return files.find((file) => file.includes(storedPath));
}
