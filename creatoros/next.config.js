/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      // Preserve Payhip-style /b/[slug] URLs — redirect to /courses/[slug]
      // All existing links, Google results, student bookmarks continue to work
      {
        source:      '/b/:slug',
        destination: '/courses/:slug',
        permanent:   true,  // 301 — tells Google to update its index
      },
    ]
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.streamable.com' },
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
    ],
  },
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  },
}

module.exports = nextConfig
