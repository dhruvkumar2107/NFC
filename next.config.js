/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // pdfkit ships its own font metrics and is resolved from node_modules at runtime.
    serverComponentsExternalPackages: ['pdfkit'],
    outputFileTracingIncludes: {
      '/api/public/**': ['./public/fonts/**', './node_modules/pdfkit/**'],
      '/api/admin/**': ['./public/fonts/**', './node_modules/pdfkit/**'],
    },
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
}

module.exports = nextConfig
