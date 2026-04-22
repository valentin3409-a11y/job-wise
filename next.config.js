/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['pdf-parse', 'mammoth'],
  },
  // Trading bot: disable static export to support API routes
  output: undefined,
}
module.exports = nextConfig
