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
const GO_API_URL = 'http://localhost:8080'

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
  banner: Banner;
  school_info: SchoolInfo;
  structure: MenuItem[];
}

// 3. Исправленная функция
export async function getSiteStructure(): Promise<ApiResponse> {
  const res = await fetch(`${GO_API_URL}/api/site-structure`, {
    next: { revalidate: 60 } 
  });

  if (!res.ok) throw new Error("Failed to fetch site structure");
  
  // Важно: вызываем .json(), а не просто логируем его
  const data = await res.json();
  return data;
}