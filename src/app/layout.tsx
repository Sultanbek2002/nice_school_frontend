import type { Metadata, Viewport } from 'next'
import { Space_Grotesk, Manrope } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import './globals.css'
import { SITE_URL, SITE_NAME, DEFAULT_TITLE, DEFAULT_DESCRIPTION, OG_IMAGE } from '@/utils/seo'
import SiteChrome from '@/app/components/Layout/SiteChrome'
import Preloader from '@/app/components/Preloader'
import RouteLoader from '@/app/components/RouteLoader'
import VisitTracker from '@/app/components/VisitTracker'
import { getSiteStructure } from '@/utils/apiData'

// /test/** (Live Test) and /gamequiz/{join,host,play}/** (live WS sessions)
// live outside the [locale] segment on purpose — this root layout wraps both
// those and the localized routes, so the locale below comes from next-intl's
// request-scoped getLocale() (resolved by middleware.ts), not a route param;
// for the un-localized routes it just falls back to the default locale.
const OG_LOCALE_MAP: Record<string, string> = { ru: 'ru_RU', ky: 'ky_KG', en: 'en_US' }

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-heading',
})

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-body',
})

// Настройки по умолчанию для ВСЕХ страниц. Каждая страница может переопределить
// свои title/description (через export const metadata или generateMetadata).
export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: DEFAULT_TITLE, template: `%s | ${SITE_NAME}` },
    description: DEFAULT_DESCRIPTION,
    applicationName: SITE_NAME,
    openGraph: {
      type: 'website',
      locale: OG_LOCALE_MAP[locale] ?? 'ru_RU',
      siteName: SITE_NAME,
      url: '/',
      title: DEFAULT_TITLE,
      description: DEFAULT_DESCRIPTION,
      images: [OG_IMAGE],
    },
    twitter: {
      card: 'summary_large_image',
      title: DEFAULT_TITLE,
      description: DEFAULT_DESCRIPTION,
      images: [OG_IMAGE.url],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
    },
    // Подтверждение владения сайтом в Яндекс.Вебмастере (способ «метатег»).
    // Рядом лежит и файл public/yandex_678a421166a0faaa.html — тот же код, оба способа рабочие.
    verification: { yandex: '678a421166a0faaa' },
  }
}

export const viewport: Viewport = {
  themeColor: '#123a6e',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const locale = await getLocale()
  const messages = await getMessages()

  let navLinks: { label: string; href: string }[] = [];
  let schoolInfo = null;
  try {
    const response = await getSiteStructure(locale);
    if (response) {
      if (Array.isArray(response.structure)) {
        navLinks = response.structure
          .sort((a: any, b: any) => a.order - b.order)
          .map((item: any) => ({
            label: item.name,
            href: item.link
          }));
      }
      schoolInfo = response.school_info;
    }
  } catch (error) {
    console.error("Ошибка при загрузке данных в layout:", error);
  }

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${spaceGrotesk.variable} ${manrope.variable} font-[family-name:var(--font-body)]`}>
      <NextIntlClientProvider locale={locale} messages={messages}>
        {/* Ambient blobs */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div
            className="absolute animate-drift"
            style={{
              width: 540, height: 540, borderRadius: '50%',
              background: 'radial-gradient(circle at 32% 30%, #4bc4ac, #17a589 55%, #0b6f5d)',
              filter: 'blur(8px)', opacity: 0.22,
              top: '10%', left: '-8%',
            }}
          />
          <div
            className="absolute animate-drift-reverse"
            style={{
              width: 440, height: 440, borderRadius: '50%',
              background: 'radial-gradient(circle at 35% 30%, #6f96c2, #123a5e 60%, #0c2d48)',
              filter: 'blur(10px)', opacity: 0.18,
              top: '5%', right: '-6%',
            }}
          />
        </div>

        <div className="relative z-10">
          <Preloader />
          <RouteLoader />
          <VisitTracker />
          <SiteChrome navData={navLinks} contactData={schoolInfo}>
            {children}
          </SiteChrome>
        </div>
      </NextIntlClientProvider>
      </body>
    </html>
  )
}
