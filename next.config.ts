import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    reactStrictMode: true,
    eslint: {
        // Build sırasında ESLint hatalarını ignore et
        ignoreDuringBuilds: true,
    },
    typescript: {
        // TypeScript hatalarını da ignore et (geçici)
        ignoreBuildErrors: true,
    },
};

export default nextConfig;