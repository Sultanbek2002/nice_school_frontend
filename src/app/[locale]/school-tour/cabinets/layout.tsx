// Страница «Учебные кабинеты» — клиентский компонент, а у таких страниц заголовок задаётся отсюда.
import { getTranslations } from 'next-intl/server'
import { pageMetadata } from '@/utils/seo'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'Meta' })
  return pageMetadata({ title: t('cabinetsTitle'), description: t('cabinetsDescription'), path: '/school-tour/cabinets', locale })
}

export default function CabinetsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
