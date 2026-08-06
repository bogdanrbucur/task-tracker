// Playwright globalTeardown: drops the shared test database and the uploads it produced.

import { deleteTestDb, deleteTestFiles, deleteTestImage } from "./tests-setup";

export default async function globalTeardown() {
	await deleteTestImage();
	await deleteTestDb();
	// Uploads under FILES_PATH were never cleaned up before and accumulated across runs
	await deleteTestFiles();
}
