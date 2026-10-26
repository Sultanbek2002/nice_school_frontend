// Страница олимпиады — клиентский компонент, поэтому заголовок и описание строим здесь из данных.
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { GO_API_URL } from '@/utils/apiData'
import { pageMetadata, truncate } from '@/utils/seo'
import { enumLabel } from '@/i18n/enumLabels'

export async function generateMetadata({ params }: { params: Promise<{ id: string; locale: string }> }): Promise<Metadata> {
  const { id, locale } = await params
  const t = await getTranslations({ locale, namespace: 'Meta' })
  const tEnums = await getTranslations({ locale, namespace: 'Enums' })
  try {
    const res = await fetch(`${GO_API_URL}/api/olympiads/${id}?lang=${locale}`, { cache: 'no-store' })
    if (res.ok) {
      const o = await res.json()
      const title = String(o.title || t('olympiadFallback')).trim()
      const facts = [
        o.subject && t('factSubject', { subject: enumLabel(tEnums, o.subject) }),
        o.format && t('factFormat', { format: enumLabel(tEnums, o.format) }),
      ].filter(Boolean).join(', ')
      return pageMetadata({
        title: t('olympiadDetailTitle', { title }),
        description: truncate(t('olympiadDetailDescription', { title, facts: facts ? ` (${facts})` : '', description: o.description || '' })),
        path: `/olympiads/${id}`,
        image: o.image_url,
        locale,
      })
    }
  } catch {}
  return pageMetadata({ title: t('olympiadFallback'), path: `/olympiads/${id}`, noindex: true, locale })
}

export default async function OlympiadLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string; locale: string }>
}) {
  const { id, locale } = await params
  // Несуществующая олимпиада → настоящий HTTP 404 (страница клиентская и сама этого сделать не может)
  let missing = false
  try {
    const res = await fetch(`${GO_API_URL}/api/olympiads/${id}?lang=${locale}`, { cache: 'no-store' })
    missing = res.status === 404
  } catch {}
  if (missing) notFound()
  return <>{children}</>
}
