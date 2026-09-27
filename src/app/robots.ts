import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/utils/seo'

// Отдаётся по адресу /robots.txt
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Закрываем только служебное. /uploads/ и /_next/ НЕ закрываем: роботу нужны
        // картинки (поиск по картинкам) и CSS/JS, чтобы понимать, как выглядит страница.
        disallow: [
          '/go-backend/', // API
          '/components/', // служебные страницы-заготовки
          '/teacher-form/', // одноразовые ссылки для анкет
          '/management-form/',
          '/my-results/', // личные результаты
          '/test/', // сессии live-тестов
          '/gamequiz/', // комнаты игры
          '/olympiads/*/test', // прохождение теста олимпиады
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
