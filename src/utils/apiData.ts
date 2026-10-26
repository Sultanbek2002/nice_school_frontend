// // src/services/api.ts
// const GO_API_URL = 'http://localhost:8080/api';

// export async function getFullSiteData() {
//   // Запускаем все запросы одновременно для максимальной скорости
//   const [menuRes, coursesRes, mentorsRes, testimonialsRes, companiesRes] = await Promise.all([
//     fetch(`${GO_API_URL}/menus`, { next: { revalidate: 60 } }),
//     fetch(`${GO_API_URL}/courses`, { next: { revalidate: 60 } }),
//     fetch(`${GO_API_URL}/mentors`, { next: { revalidate: 60 } }),
//     fetch(`${GO_API_URL}/testimonials`, { next: { revalidate: 60 } }),
//     fetch(`${GO_API_URL}/companies`, { next: { revalidate: 60 } }),
//   ]);

//   // Проверяем ответы и собираем их в один объект
//   return {
//     HeaderData: await menuRes.json(),
//     CourseData: await coursesRes.json(),
//     MentorData: await mentorsRes.json(),
//     TestimonialData: await testimonialsRes.json(),
//     TechGaintsData: await companiesRes.json(),
//   };
// }
// Типизация данных
// Server-side: direct HTTP (no mixed-content issue, server-to-server)
// Client-side: relative /go-backend proxy → Next.js rewrites to HTTP backend
const BACKEND_DIRECT = process.env.BACKEND_URL || 'http://172.20.10.2:8080'
export const GO_API_URL = typeof window === 'undefined' ? BACKEND_DIRECT : '/go-backend'

// WebSocket goes through the same /go-backend rewrite as HTTP.
// On the client we derive ws(s):// from window.location so the proxy handles the upgrade.
// Override with NEXT_PUBLIC_GAME_WS_URL in production if needed.
export const GAME_WS_URL =
  process.env.NEXT_PUBLIC_GAME_WS_URL ||
  (typeof window !== 'undefined'
    ? `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/go-backend`
    : BACKEND_DIRECT.replace(/^http/, 'ws'))

// Normalizes any stored backend image URL (old IPs, localhost) to the current backend URL
export function fixImageUrl(url: string, fallback = '/images/courses/placeholder.png'): string {
  if (!url) return fallback
  // Use relative /uploads/ path so images go through Next.js proxy (IP-independent)
  const match = url.match(/(\/uploads\/.+)/)
  if (match) return match[1]
  return url
}

// 1. Интерфейсы для новых полей
export interface Banner {
  photo: string;
  title: string;
  sub_title: string;
  is_active: boolean;
}

export interface SchoolInfo {
  address: string;
  email: string;
  telegram: string;
  whatsapp: string;
  instagram: string;
  facebook: string;
  phones: string;
  students_count?: number;
  courses_count?: number;
  teachers_count?: number;
  satisfaction_rate?: number;
}

export interface Block {
  ID: number;
  type: string;
  position: number;
  content: string;
  // untranslated original, sent by the backend alongside a translated `content`
  content_source?: string;
}

// URL slug for a course/teacher. Always derived from the UNTRANSLATED title or
// name, so /ru/courses/x, /ky/courses/x and /en/courses/x are the same page and
// switching language keeps working.
export function makeSlug(text: string): string {
  return encodeURIComponent(text.toLowerCase().trim().replace(/\s+/g, '-'))
}

const SLUG_FIELD: Record<string, string> = { courses_grid: 'title', teachers_grid: 'fullName' }

// Adds a stable `_slug` to every course/teacher item, computed from the same
// item in the untranslated source (array order is identical — translation
// preserves structure). Components and detail pages match on `_slug`.
function attachSlugs(block: Block): Block {
  const field = SLUG_FIELD[block.type]
  if (!field || !block.content) return block
  try {
    const items = JSON.parse(block.content)
    const source = JSON.parse(block.content_source || block.content)
    if (!Array.isArray(items) || !Array.isArray(source)) return block
    items.forEach((item: any, i: number) => {
      const src = source[i]?.[field] ?? item?.[field]
      if (item && typeof src === 'string') item._slug = makeSlug(src)
    })
    return { ...block, content: JSON.stringify(items) }
  } catch {
    return block
  }
}

export interface MenuItem {
  ID: number;
  name: string;
  link: string;
  order: number;
  blocks: Block[];
}

// 2. ГЛАВНЫЙ ИНТЕРФЕЙС ОТВЕТА (соответствует твоему JSON)
export interface ApiResponse {
  olympiads: any;
  banner: Banner;
  school_info: SchoolInfo;
  structure: MenuItem[];
}

// 3. Исправленная функция
export async function getSiteStructure(locale: string = 'ru'): Promise<ApiResponse> {
  const res = await fetch(`${GO_API_URL}/api/site-structure?lang=${locale}`, {
    cache: 'no-store'
  });

  if (!res.ok) throw new Error("Failed to fetch site structure");
  
  // Важно: вызываем .json(), а не просто логируем его
  const data: ApiResponse = await res.json();
  if (Array.isArray(data.structure)) {
    data.structure = data.structure.map((menu) => ({
      ...menu,
      blocks: Array.isArray(menu.blocks) ? menu.blocks.map(attachSlugs) : menu.blocks,
    }));
  }
  return data;
}