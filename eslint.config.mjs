// Flat config, replacing .eslintrc.json.
// Next.js 16 removed `next lint`, and ESLint 9 no longer reads .eslintrc.* by default,
// so the `lint` script now calls eslint directly against this file.
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

export default [
	{
		ignores: [".next/**", "out/**", "build/**", "node_modules/**", "next-env.d.ts", "prisma/migrations/**", "playwright-report/**", "test-results/**", "test/**"],
	},
	...nextCoreWebVitals,
	...nextTypescript,
	{
		// This is the first time lint has actually run on this codebase, and the presets flag ~100
		// pre-existing issues in code that predates them. These are demoted to warnings so `npm run
		// lint` is usable as a gate on new code instead of failing on day one. They still show up in
		// the output - burn them down over time, then promote the rules back to "error".
		rules: {
			// Used deliberately throughout: `catch (e: any)`, `task?: any` props
			"@typescript-eslint/no-explicit-any": "warn",
			// tailwind.config.ts needs require() for plugins; seed.js and dailyTasks.js are CommonJS
			"@typescript-eslint/no-require-imports": "warn",
			// The shadcn/ui generated `interface Props extends X {}` pattern
			"@typescript-eslint/no-empty-object-type": "warn",
			"@typescript-eslint/no-non-null-asserted-optional-chain": "warn",
			"@typescript-eslint/ban-ts-comment": "warn",
			"react/no-unescaped-entities": "warn",
			// Worth reviewing properly - these can mask real render-loop and mutation bugs
			"react-hooks/set-state-in-effect": "warn",
			"react-hooks/immutability": "warn",
		},
	},
];
