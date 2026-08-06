// Playwright globalSetup: seeds the shared test database once, before any spec runs.
//
// This used to live in a beforeAll inside full-cycle-task.spec.ts, whose afterAll dropped the
// database - which meant a second spec file would race against the first file's teardown. Hoisting
// it here is what lets the suite be split across files.

import {
	createTaskStatuses,
	createTestDepartment,
	createTestImage,
	createTestUser,
	createWorkflowUsers,
	deleteExistingScreenshots,
	deleteTestFiles,
	migrateTestDb,
	resetTestDb,
} from "./tests-setup";

export default async function globalSetup() {
	// Make sure the schema exists before touching any table - `npm run dev-test` normally does this
	// first, but the suite can also be run against an already-running server.
	migrateTestDb();

	// Start from a clean slate. This truncates rather than deleting the database file: the Next
	// server is already running and holding a handle to it. A run that crashed before teardown
	// would otherwise fail here on the unique email constraint.
	await resetTestDb();
	await deleteTestFiles();

	await deleteExistingScreenshots();
	// After deleteExistingScreenshots, which clears every .png in ./tests
	await createTestImage();
	await createTestUser();
	await createTaskStatuses();
	const department = await createTestDepartment();
	// Seeded here, not in workflows.spec's beforeAll - see the note on createWorkflowUsers
	await createWorkflowUsers(department.id);
}
