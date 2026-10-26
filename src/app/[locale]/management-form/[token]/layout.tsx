// Приватная страница: не должна попадать в поисковую выдачу.
import { getTranslations } from 'next-intl/server'
import { pageMetadata } from '@/utils/seo'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'Meta' })
  return pageMetadata({ title: t('managementFormTitle'), path: '/management-form', locale, noindex: true })
}

export default function ManagementFormLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
