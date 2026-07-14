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
const BACKEND_DIRECT = process.env.BACKEND_URL || 'http://localhost:8080'
export const GO_API_URL = typeof window === 'undefined' ? BACKEND_DIRECT : '/go-backend'

// GameQuiz WebSocket connections go straight to the Go backend rather than through
// the /go-backend Next.js rewrite, which is HTTP-oriented and not guaranteed to
// proxy the WS upgrade handshake in every hosting setup. Override with
// NEXT_PUBLIC_GAME_WS_URL in production.
export const GAME_WS_URL = process.env.NEXT_PUBLIC_GAME_WS_URL || BACKEND_DIRECT.replace(/^http/, 'ws')

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
}

export interface Block {
  ID: number;
  type: string;
  position: number;
  content: string; 
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
export async function getSiteStructure(): Promise<ApiResponse> {
  const res = await fetch(`${GO_API_URL}/api/site-structure`, {
    cache: 'no-store'
  });

  if (!res.ok) throw new Error("Failed to fetch site structure");
  
  // Важно: вызываем .json(), а не просто логируем его
  const data = await res.json();
  return data;
}