import createMiddleware from 'next-intl/middleware';
import { routing } from '@/i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Match all pathnames except for
  // - API routes (/api/*)
  // - Static files (/_next/static/*, /_next/image/*)
  // - Vercel internals (/_vercel/*)
  // - Anything containing a dot (favicons, manifest, robots.txt, etc.)
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
