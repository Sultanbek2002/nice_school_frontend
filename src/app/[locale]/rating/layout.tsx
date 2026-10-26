// Страница «Рейтинг учеников» — клиентский компонент, а у таких страниц заголовок задаётся отсюда.
import { getTranslations } from 'next-intl/server'
import { pageMetadata } from '@/utils/seo'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'Meta' })
  return pageMetadata({ title: t('ratingTitle'), description: t('ratingDescription'), path: '/rating', locale })
}

export default function RatingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
