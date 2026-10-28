import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  // Kyrgyz is temporarily disabled (translations stay in messages/ky.json and
  // the backend keeps producing them — re-add 'ky' here to turn it back on).
  locales: ['ru', 'en'],
  defaultLocale: 'ru',
})

export type Locale = (typeof routing.locales)[number]
