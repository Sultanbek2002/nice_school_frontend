import type { Viewport } from 'next'
import { getTranslations } from 'next-intl/server'
import { pageMetadata } from '@/utils/seo'

// Prevents iOS Safari auto-zoom on input focus for the test page
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

// Приватная страница (прохождение теста): не должна попадать в поисковую выдачу.
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'Meta' })
  return pageMetadata({ title: t('olympiadTestTitle'), path: '/olympiads', noindex: true, locale })
}

export default function TestLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
