/** @type {import('next').NextConfig} */
const nextConfig = {
	// Next 16 allows only one dev server per dist dir, so the Playwright suite uses its own
	// (.next-test). Without this, `npm test` fails whenever a normal `npm run dev` is running.
	distDir: process.env.NEXT_DIST_DIR || ".next",
	// webpack: (config) => {
	// 	config.externals.push("@node-rs/argon2", "@node-rs/bcrypt");
	// 	return config;
	// },
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
