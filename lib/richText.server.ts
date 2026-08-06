// Server-only: relies on FILES_PATH, which is not exposed to the browser.
// Where inline description images live on disk - outside public/, alongside attachments/ and avatars/
export function descriptionImagesDir() {
	return `${process.env.FILES_PATH}/descriptions`;
}
