/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@clipsync/ui'],
  images: {
    formats: ['image/avif', 'image/webp'],
  },
}

module.exports = nextConfig
