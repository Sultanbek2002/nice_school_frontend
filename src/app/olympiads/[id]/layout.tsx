// Страница олимпиады — клиентский компонент, поэтому заголовок и описание строим здесь из данных.
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { GO_API_URL } from '@/utils/apiData'
import { pageMetadata, truncate } from '@/utils/seo'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  try {
    const res = await fetch(`${GO_API_URL}/api/olympiads/${id}`, { cache: 'no-store' })
    if (res.ok) {
      const o = await res.json()
      const title = String(o.title || 'Олимпиада').trim()
      const facts = [o.subject && `предмет: ${o.subject}`, o.format && `формат: ${o.format}`].filter(Boolean).join(', ')
      return pageMetadata({
        title: `${title} — олимпиада`,
        description: truncate(`Олимпиада «${title}»${facts ? ` (${facts})` : ''}. ${o.description || ''}`),
        path: `/olympiads/${id}`,
        image: o.image_url,
      })
    }
  } catch {}
  return pageMetadata({ title: 'Олимпиада', path: `/olympiads/${id}`, noindex: true })
}

export default async function OlympiadLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  // Несуществующая олимпиада → настоящий HTTP 404 (страница клиентская и сама этого сделать не может)
  let missing = false
  try {
    const res = await fetch(`${GO_API_URL}/api/olympiads/${id}`, { cache: 'no-store' })
    missing = res.status === 404
  } catch {}
  if (missing) notFound()
  return <>{children}</>
}
