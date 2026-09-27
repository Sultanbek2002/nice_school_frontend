import type { MetadataRoute } from 'next'
import { GO_API_URL } from '@/utils/apiData'
import { SITE_URL, teacherSlug } from '@/utils/seo'

// Карта сайта собирается при каждом запросе из базы — новые учителя, олимпиады
// и страницы меню попадают в неё сами, без ручной правки.
export const dynamic = 'force-dynamic'

async function getJson(path: string): Promise<any | null> {
  try {
    const res = await fetch(`${GO_API_URL}${path}`, { cache: 'no-store' })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

const STATIC_PAGES: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'] }[] = [
  { path: '/', priority: 1.0, changeFrequency: 'weekly' },
  { path: '/about', priority: 0.9, changeFrequency: 'monthly' },
  { path: '/olympiads', priority: 0.9, changeFrequency: 'weekly' },
  { path: '/resources', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/school-tour', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/management', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/games', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/school-tour/cabinets', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/rating', priority: 0.6, changeFrequency: 'weekly' },
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [site, olympiads, games] = await Promise.all([
    getJson('/api/site-structure'),
    getJson('/api/olympiads'),
    getJson('/api/games'),
  ])

  const seen = new Set<string>()
  const entries: MetadataRoute.Sitemap = []
  const add = (path: string, opts: Partial<MetadataRoute.Sitemap[number]> = {}) => {
    if (seen.has(path)) return
    seen.add(path)
    entries.push({ url: `${SITE_URL}${path}`, ...opts })
  }

  for (const p of STATIC_PAGES) add(p.path, { priority: p.priority, changeFrequency: p.changeFrequency })

  // Страницы, созданные в админке («Меню сайта») + учителя из блоков teachers_grid
  for (const menu of site?.structure ?? []) {
    const link = typeof menu.link === 'string' ? menu.link.trim() : ''
    if (link.startsWith('/')) {
      add(link, { lastModified: menu.UpdatedAt ? new Date(menu.UpdatedAt) : undefined, priority: 0.7, changeFrequency: 'weekly' })
    }
    for (const block of menu.blocks ?? []) {
      if ((block.type !== 'teachers_grid' && block.type !== 'courses_grid') || !block.content) continue
      try {
        const parsed = JSON.parse(block.content)
        const list = Array.isArray(parsed) ? parsed : [parsed]
        for (const item of list) {
          if (block.type === 'teachers_grid' && item?.fullName) {
            add(`/mentors/${teacherSlug(item.fullName)}`, { priority: 0.6, changeFrequency: 'monthly' })
          } else if (block.type === 'courses_grid' && item?.title) {
            add(`/courses/${teacherSlug(item.title)}`, { priority: 0.7, changeFrequency: 'monthly' })
          }
        }
      } catch {
        /* битый JSON блока — пропускаем */
      }
    }
  }

  for (const o of Array.isArray(olympiads) ? olympiads : []) {
    add(`/olympiads/${o.ID}`, { lastModified: o.UpdatedAt ? new Date(o.UpdatedAt) : undefined, priority: 0.7, changeFrequency: 'weekly' })
  }

  for (const g of Array.isArray(games) ? games : []) {
    if (g.status && g.status !== 'active') continue
    add(`/games/${g.ID}`, { lastModified: g.UpdatedAt ? new Date(g.UpdatedAt) : undefined, priority: 0.5, changeFrequency: 'monthly' })
  }

  return entries
}
