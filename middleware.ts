import createMiddleware from 'next-intl/middleware';
import { routing } from '@/i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Match all pathnames except for
  // - API routes (/api/*)
  // - Static files (/_next/static/*, /_next/image/*)
  // - Vercel internals (/_vercel/*)
  // - PWA metadata icon routes (/icon*, /apple-icon) — must not be locale-
  //   prefixed or the manifest can't load them
  // - Anything containing a dot (favicons, manifest.webmanifest, sw.js, etc.)
  matcher: ['/((?!api|_next|_vercel|icon|apple-icon|.*\\..*).*)'],
};
