/** @type {import('next').NextConfig} */
const nextConfig = {
  // Existing config options...
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Add environment variables at build time
  env: {
    BUILD_DATE: new Date().toISOString(),
  },
}

export default nextConfig
