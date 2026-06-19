import createNextIntlPlugin from 'next-intl/plugin';
import withSerwistInit from '@serwist/next';
import type { NextConfig } from 'next';

const withNextIntl = createNextIntlPlugin('./src/i18n/config.ts');

/**
 * Serwist compiles `app/sw.ts` → `public/sw.js` and auto-registers it, which
 * is what makes the app installable as a desktop/standalone PWA.
 *
 * Disabled in dev: the SW in `next dev` triggers Next 15's
 * `clientReferenceManifest` invariant (500s on some routes). The PWA install
 * is a production feature — test it with `pnpm build && pnpm start`.
 */
const withSerwist = withSerwistInit({
  swSrc: 'app/sw.ts',
  swDest: 'public/sw.js',
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === 'development',
});

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

export default withSerwist(withNextIntl(nextConfig));
