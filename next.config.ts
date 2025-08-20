import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    reactStrictMode: true,
    swcMinify: true,

    // Eğer static export istiyorsanız (daha hızlı, önerilen)
    // output: 'export',
    // trailingSlash: true,
    // images: {
    //   unoptimized: true
    // }
};

export default nextConfig;