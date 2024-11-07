import fs from "fs-extra";
import path from "path";

export function getVersion(): string {
	const packageJsonPath = path.resolve(process.cwd(), "package.json");
	const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
	return packageJson.version;
}
