/** @type {import('next').NextConfig} */
const nextConfig = {
	// Next 16 allows only one dev server per dist dir, so the Playwright suite uses its own
	// (.next-test). Without this, `npm test` fails whenever a normal `npm run dev` is running.
	distDir: process.env.NEXT_DIST_DIR || ".next",
	// webpack: (config) => {
	// 	config.externals.push("@node-rs/argon2", "@node-rs/bcrypt");
	// 	return config;
	// },
	// Response headers applied to every route.
	//
	// Deliberately no `script-src`: Next and next-themes inject inline scripts, so a script policy
	// needs nonce plumbing and can break the app in subtle ways. Everything below is inert for a
	// working app and cannot break rendering.
	//
	// HSTS is not set here - it belongs at the TLS terminator (nginx/Certbot), not in the app.
	async headers() {
		return [
			{
				source: "/:path*",
				headers: [
					// frame-ancestors stops clickjacking, which the server-action origin check does
					// NOT cover: a framed click is genuine and same-origin
					{ key: "Content-Security-Policy", value: "frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'" },
					// Same protection for browsers that predate frame-ancestors
					{ key: "X-Frame-Options", value: "DENY" },
					{ key: "X-Content-Type-Options", value: "nosniff" },
					// Keeps the password-reset token out of the Referer header on outbound links
					{ key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
				],
			},
		];
	},

	experimental: {
		serverActions: {
			allowedForwardedHosts: ["localhost:3000", "127.0.0.1:3000", "127.0.0.1:3001", "127.0.0.1:3002", "localhost:3001", "localhost:3002"],
			allowedOrigins: ["tasks.asm-maritime.com"],
			bodySizeLimit: '4mb',
		},
	},
// eslint: {ignoreDuringBuilds: true},
};

export default nextConfig;
