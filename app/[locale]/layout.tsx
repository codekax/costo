import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Sofia_Sans } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner';
import { Providers } from '@/components/providers';
import { routing, type Locale } from '@/i18n/routing';
import '../globals.css';

/**
 * Sofia Sans substitutes MarkForMC (Mastercard proprietary).
 * Mastercard's own declared fallback stack lists Sofia Sans first — the
 * variable wght axis exposes 450 (body) and 500 (display) directly.
 */
const sofiaSans = Sofia_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sofia-sans',
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
    <html lang={locale} suppressHydrationWarning className={sofiaSans.variable}>
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
