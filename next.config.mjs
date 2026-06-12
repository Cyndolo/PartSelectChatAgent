/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack(config, { dev }) {
    if (dev) {
      // Avoid stale .next/cache webpack pack files interrupting local demos after cache cleanup.
      config.cache = false;
    }

    return config;
  }
};

export default nextConfig;
