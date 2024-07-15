/** @type {import('next').NextConfig} */
const nextConfig = {
	webpack: (config) => {
		config.externals.push("@node-rs/argon2", "@node-rs/bcrypt");
		return config;
	},
	experimental: {
		serverActions: {
 			allowedForwardedHosts: ['localhost:3000', '127.0.0.1:3000'],
			allowedOrigins: ['tasks.tetrabit.dev']
		},
	}
};

export default nextConfig;
