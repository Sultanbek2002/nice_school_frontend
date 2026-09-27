import type { Metadata } from 'next'

// Канонический адрес сайта. www.nice.kg и nice.kg отдают одно и то же —
// canonical говорит поисковикам, какой из адресов «главный», чтобы не считать их дублями.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://nice.kg').replace(/\/$/, '')

export const SITE_NAME = 'NICE International School'

export const DEFAULT_TITLE = `${SITE_NAME} — международная школа в Оше`

// ~150 символов: Google обрезает описание в выдаче примерно на 155-160
export const DEFAULT_DESCRIPTION =
  'Современная международная школа в Оше (Кыргызстан): сильные учителя, олимпиады, интерактивные уроки и учебные игры. Запишитесь на тур по школе.'

// Данные школы — их же использует блок «Найдите нас» (SchoolMap) и разметка для Google
export const SCHOOL = {
  name: SITE_NAME,
  street: 'Малабекова 56/1',
  city: 'Ош',
  country: 'KG',
  lat: 40.503572,
  lng: 72.7069621,
}

export const OG_IMAGE = {
  url: '/images/og-cover.png',
  width: 1200,
  height: 630,
  alt: `${SITE_NAME} — международная школа в Оше`,
}

// Тот же алгоритм, что в карточках учителей и курсов (Home/Mentor, componentsMenu/teachers, courses)
export function teacherSlug(name: string): string {
  return encodeURIComponent(name.toLowerCase().replace(/\s+/g, '-'))
}
export const slugify = teacherSlug

// Из HTML/длинного текста — короткое описание для сниппета (без тегов, обрезка по слову)
export function truncate(text: string | undefined | null, max = 155): string {
  if (!text) return ''
  const clean = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  if (clean.length <= max) return clean
  const cut = clean.slice(0, max)
  return cut.slice(0, cut.lastIndexOf(' ') > 60 ? cut.lastIndexOf(' ') : max).trimEnd() + '…'
}

// Абсолютный URL картинки (фото из /uploads/ и внешние ссылки → полный адрес)
export function absoluteImage(url?: string | null): string {
  if (!url) return OG_IMAGE.url
  const m = url.match(/(\/uploads\/.+)/)
  if (m) return m[1]
  return url
}

const isUrl = (s?: string | null): s is string => !!s && /^https?:\/\//i.test(s.trim())

/**
 * Структурированные данные (schema.org) — «паспорт школы» для Google:
 * название, адрес, координаты, контакты, соцсети. Помогает показать школу
 * в карточке организации и в поиске по картам.
 */
export function schoolJsonLd(info?: { phones?: string; email?: string; telegram?: string; instagram?: string; facebook?: string } | null) {
  const phone = info?.phones?.split(/[,;\n]/)[0]?.trim()
  const sameAs = [info?.telegram, info?.instagram, info?.facebook].filter(isUrl).map((s) => s.trim())

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'School',
        '@id': `${SITE_URL}/#school`,
        name: SCHOOL.name,
        url: SITE_URL,
        logo: `${SITE_URL}/icon.png`,
        image: `${SITE_URL}${OG_IMAGE.url}`,
        description: DEFAULT_DESCRIPTION,
        address: {
          '@type': 'PostalAddress',
          streetAddress: SCHOOL.street,
          addressLocality: SCHOOL.city,
          addressCountry: SCHOOL.country,
        },
        geo: { '@type': 'GeoCoordinates', latitude: SCHOOL.lat, longitude: SCHOOL.lng },
        ...(phone ? { telephone: phone } : {}),
        ...(info?.email ? { email: info.email } : {}),
        ...(sameAs.length ? { sameAs } : {}),
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        url: SITE_URL,
        name: SITE_NAME,
        inLanguage: 'ru',
        publisher: { '@id': `${SITE_URL}/#school` },
      },
    ],
  }
}

// JSON для <script type="application/ld+json">: '<' экранируем, чтобы данные из админки
// не могли «закрыть» тег script и внедрить код
export function jsonLdString(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}

interface PageMetaInput {
  title?: string | { absolute: string }
  description?: string
  path: string // '/about', '/mentors/иванова-анна' — без домена
  image?: string | null
  noindex?: boolean
  // Раздел с вложенными страницами (/olympiads → /olympiads/29): без этого Next.js «теряет»
  // шаблон «%s | NICE International School» у вложенных страниц
  hasChildren?: boolean
}

/**
 * Собирает полный набор мета-тегов страницы: title, description, canonical,
 * Open Graph (превью в WhatsApp/Telegram/Соцсетях) и Twitter-карточку.
 * В Next.js openGraph страницы ПОЛНОСТЬЮ заменяет openGraph родителя (не сливается),
 * поэтому каждый раз собираем его целиком.
 */
export function pageMetadata({ title, description = DEFAULT_DESCRIPTION, path, image, noindex, hasChildren }: PageMetaInput): Metadata {
  const ogTitle = typeof title === 'string' ? `${title} | ${SITE_NAME}` : title?.absolute ?? DEFAULT_TITLE
  const img = image ? { url: absoluteImage(image), alt: typeof title === 'string' ? title : SITE_NAME } : OG_IMAGE

  const metaTitle =
    hasChildren && typeof title === 'string'
      ? { default: title, template: `%s | ${SITE_NAME}` }
      : title

  return {
    title: metaTitle,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: 'website',
      locale: 'ru_RU',
      siteName: SITE_NAME,
      url: path,
      title: ogTitle,
      description,
      images: [img],
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description,
      images: [img.url],
    },
    ...(noindex ? { robots: { index: false, follow: false } } : {}),
  }
}
