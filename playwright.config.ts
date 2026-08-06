import { defineConfig } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";

// Load .env.test file
dotenv.config({ path: path.resolve(__dirname, ".env.test") });

export default defineConfig({
	testDir: "tests",
	// Seeding and teardown are global so that multiple spec files can share one database
	globalSetup: "./tests/global-setup.ts",
	globalTeardown: "./tests/global-teardown.ts",
	// The specs share a single SQLite database and depend on ordering - they must not run in parallel
	workers: 1,
	fullyParallel: false,
	use: {
		browserName: "chromium",
		headless: true,
		baseURL: "http://localhost:3535",
	},
	// Kept as "always" for local runs; set PW_TEST_HTML_REPORT_OPEN=never for unattended ones
	reporter: [["html", { outputFolder: "playwright-report", open: "always" }]],
});
