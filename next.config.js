/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
  api: {
    bodySize: '50mb',
  },
}

module.exports = nextConfig
