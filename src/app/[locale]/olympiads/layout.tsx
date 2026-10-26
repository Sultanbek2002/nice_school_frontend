// Страница «Олимпиады» — клиентский компонент, а у таких страниц заголовок задаётся отсюда.
import { getTranslations } from 'next-intl/server'
import { pageMetadata } from '@/utils/seo'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'Meta' })
  return pageMetadata({ title: t('olympiadsTitle'), description: t('olympiadsDescription'), path: '/olympiads', locale, hasChildren: true })
}

export default function OlympiadsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
