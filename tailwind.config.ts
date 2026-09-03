import type { Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";

// Catppuccin palette bridge.
//
// The app addresses colour two ways: semantic tokens (bg-primary, text-muted-foreground) and named
// Tailwind palettes (`text-red-600 dark:text-red-400`, `bg-green-500`, and StatusBadge's runtime
// `bg-${status.color}-100`, which is why those classes are safelisted below). Rather than rewrite
// every call site, the named palettes are rebuilt here on top of the `--ctp-*` vars from
// globals.css, so a class like `text-red-600` means "Latte red in light, Mocha red in dark".
//
// Each ramp collapses to the four rungs those vars define - see the comment in globals.css for
// what each rung is for. Shades are grouped, not interpolated: any shade in a group is the same
// colour, so `bg-red-400` and `bg-red-500` are interchangeable.
const ctp = (name: string) => ({
	50: `hsl(var(--ctp-${name}-tint) / <alpha-value>)`,
	100: `hsl(var(--ctp-${name}-tint) / <alpha-value>)`,
	200: `hsl(var(--ctp-${name}-tint) / <alpha-value>)`,
	300: `hsl(var(--ctp-${name}) / <alpha-value>)`,
	400: `hsl(var(--ctp-${name}) / <alpha-value>)`,
	500: `hsl(var(--ctp-${name}) / <alpha-value>)`,
	600: `hsl(var(--ctp-${name}-strong) / <alpha-value>)`,
	700: `hsl(var(--ctp-${name}-strong) / <alpha-value>)`,
	800: `hsl(var(--ctp-${name}-deep) / <alpha-value>)`,
	900: `hsl(var(--ctp-${name}-deep) / <alpha-value>)`,
	950: `hsl(var(--ctp-${name}-deep) / <alpha-value>)`,
	DEFAULT: `hsl(var(--ctp-${name}) / <alpha-value>)`,
});

const config = {
	darkMode: ["class"],
	content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: "2rem",
			screens: {
				"2xl": "1400px",
			},
		},
		extend: {
			colors: {
				// Named palettes remapped onto Catppuccin - several Tailwind names share a flavour
				// accent where Catppuccin has no direct equivalent (e.g. lime/emerald -> green).
				red: ctp("red"),
				rose: ctp("maroon"),
				pink: ctp("pink"),
				fuchsia: ctp("mauve"),
				purple: ctp("mauve"),
				violet: ctp("mauve"),
				indigo: ctp("lavender"),
				blue: ctp("blue"),
				sky: ctp("sky"),
				cyan: ctp("sky"),
				teal: ctp("teal"),
				emerald: ctp("green"),
				green: ctp("green"),
				lime: ctp("lime"),
				yellow: ctp("yellow"),
				amber: ctp("yellow"),
				orange: ctp("peach"),
				gray: ctp("overlay"),
				slate: ctp("overlay"),
				zinc: ctp("overlay"),
				neutral: ctp("overlay"),
				stone: ctp("overlay"),
				border: "hsl(var(--border))",
				input: "hsl(var(--input))",
				ring: "hsl(var(--ring))",
				background: "hsl(var(--background))",
				foreground: "hsl(var(--foreground))",
				// `soft` is the button fill: each flavour's own soft rendering of the accent (a pale
				// wash in Latte, the pastel accent solid in Macchiato). See globals.css.
				primary: {
					DEFAULT: "hsl(var(--primary))",
					foreground: "hsl(var(--primary-foreground))",
					soft: "hsl(var(--primary-soft))",
					"soft-hover": "hsl(var(--primary-soft-hover))",
					"soft-foreground": "hsl(var(--primary-soft-foreground))",
				},
				secondary: {
					DEFAULT: "hsl(var(--secondary))",
					foreground: "hsl(var(--secondary-foreground))",
				},
				destructive: {
					DEFAULT: "hsl(var(--destructive))",
					foreground: "hsl(var(--destructive-foreground))",
					soft: "hsl(var(--destructive-soft))",
					"soft-hover": "hsl(var(--destructive-soft-hover))",
					"soft-foreground": "hsl(var(--destructive-soft-foreground))",
				},
				success: {
					soft: "hsl(var(--success-soft))",
					"soft-hover": "hsl(var(--success-soft-hover))",
					"soft-foreground": "hsl(var(--success-soft-foreground))",
				},
				muted: {
					DEFAULT: "hsl(var(--muted))",
					foreground: "hsl(var(--muted-foreground))",
				},
				accent: {
					DEFAULT: "hsl(var(--accent))",
					foreground: "hsl(var(--accent-foreground))",
				},
				popover: {
					DEFAULT: "hsl(var(--popover))",
					foreground: "hsl(var(--popover-foreground))",
				},
				card: {
					DEFAULT: "hsl(var(--card))",
					foreground: "hsl(var(--card-foreground))",
				},
			},
			borderRadius: {
				lg: "var(--radius)",
				md: "calc(var(--radius) - 2px)",
				sm: "calc(var(--radius) - 4px)",
			},
			keyframes: {
				"accordion-down": {
					from: { height: "0" },
					to: { height: "var(--radix-accordion-content-height)" },
				},
				"accordion-up": {
					from: { height: "var(--radix-accordion-content-height)" },
					to: { height: "0" },
				},
			},
			animation: {
				"accordion-down": "accordion-down 0.2s ease-out",
				"accordion-up": "accordion-up 0.2s ease-out",
			},
			fontFamily: {
				sans: ["var(--font-sans)", ...fontFamily.sans],
			},
		},
	},
	plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
	// StatusBadge builds its classes at runtime from Status.color, so they can't be found by
	// scanning source. Both rungs are flavour-aware, so no `dark:` variants are needed.
	safelist: [
		"w-24",
		"min-w-24",
		"min-w-28",
		...["blue", "green", "red", "gray", "yellow"].flatMap((c) => [`bg-${c}-100`, `text-${c}-700`, `border-${c}-400/40`]),
	],
} satisfies Config;

export default config;
