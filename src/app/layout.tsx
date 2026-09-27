import type { Metadata, Viewport } from 'next'
import { Space_Grotesk, Manrope } from 'next/font/google'
import './globals.css'
import { SITE_URL, SITE_NAME, DEFAULT_TITLE, DEFAULT_DESCRIPTION, OG_IMAGE } from '@/utils/seo'
import Header from '@/app/components/Layout/Header'
import Footer from '@/app/components/Layout/Footer'
import Preloader from '@/app/components/Preloader'
import RouteLoader from '@/app/components/RouteLoader'
import { getSiteStructure } from '@/utils/apiData'

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
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: DEFAULT_TITLE, template: `%s | ${SITE_NAME}` },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  openGraph: {
    type: 'website',
    locale: 'ru_RU',
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
}

export const viewport: Viewport = {
  themeColor: '#123a6e',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  let navLinks: { label: string; href: string }[] = [];
  let schoolInfo = null;
  try {
    const response = await getSiteStructure();
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
    <html lang='ru' suppressHydrationWarning>
      <body className={`${spaceGrotesk.variable} ${manrope.variable} font-[family-name:var(--font-body)]`}>
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
          <Header navData={navLinks} contactData={schoolInfo} />
          <main className="pt-20">
            {children}
          </main>
          <Footer data={schoolInfo} navLinks={navLinks} />
        </div>
      </body>
    </html>
  )
}
