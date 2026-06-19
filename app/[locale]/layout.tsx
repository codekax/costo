import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Inter } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner';
import { Providers } from '@/components/providers';
import { routing, type Locale } from '@/i18n/routing';
import '../globals.css';

/**
 * Inter Variable — the Linear typeface. Drives the whole app via `--font-sans`
 * in globals.css. The Linear OpenType signature (`cv01`+`ss03`) is applied on
 * `body` there, not here.
 */
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  weight: 'variable',
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

function isLocale(value: string): value is Locale {
  return (routing.locales as readonly string[]).includes(value);
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={inter.variable}
    >
      <body className="bg-background text-foreground font-sans antialiased">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Providers>
            {children}
            <Toaster richColors closeButton position="top-right" />
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
