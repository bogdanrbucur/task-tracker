import { defineConfig } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";

// Load .env.test file
dotenv.config({ path: path.resolve(__dirname, ".env.test") });

export default defineConfig({
	testDir: "tests",
	use: {
		browserName: "chromium",
		headless: true,
		baseURL: "http://localhost:3535",
	},
	reporter: [["html", { outputFolder: "playwright-report", open: "always" }]],
});
