/** @type {import('next').NextConfig} */
const nextConfig = {
	webpack: (config) => {
		config.externals.push("@node-rs/argon2", "@node-rs/bcrypt");
		return config;
	},
	experimental: {
		serverActions: {
			allowedForwardedHosts: ["localhost:3000", "127.0.0.1:3000", "127.0.0.1:3001", "127.0.0.1:3002", "localhost:3001", "localhost:3002"],
			allowedOrigins: ["tasks.asm-maritime.com"],
		},
	},
eslint: {ignoreDuringBuilds: true},
};

export default nextConfig;
