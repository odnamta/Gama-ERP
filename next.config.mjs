import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,

  // Skip ESLint during Vercel builds — hundreds of pre-existing unused-var
  // warnings are treated as errors by Next.js production linting.
  // TypeScript type-checking still runs.
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Remove console.log in production (keep error/warn for debugging)
  compiler: {
    removeConsole: {
      exclude: ['error', 'warn'],
    },
  },

  // Allow file uploads up to 11MB via server actions (document attachments are max 10MB)
  experimental: {
    serverActions: {
      bodySizeLimit: '11mb',
    },
  },
};

export default withBundleAnalyzer(nextConfig);
