import createNextIntlPlugin from 'next-intl/plugin';
import type { NextConfig } from 'next';

const withNextIntl = createNextIntlPlugin('./src/i18n/config.ts');

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typedRoutes: true,
  /**
   * Avoid barrel-file overhead in dev + cold starts.
   *
   * Each of these packages re-exports hundreds of modules from a single
   * entry point. Without this transform, `import { Receipt } from 'lucide-react'`
   * pulls ~1,583 modules per file (200–800ms cost). With optimizePackageImports
   * Next.js rewrites the imports to direct paths at build time.
   */
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'radix-ui',
      '@tanstack/react-query',
      'd3',
      'date-fns',
      'date-fns-tz',
      'sonner',
      'cmdk',
    ],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/**',
      },
    ],
  },
};

export default withNextIntl(nextConfig);
