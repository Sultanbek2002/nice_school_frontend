import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: ['ru', 'ky', 'en'],
  defaultLocale: 'ru',
})

export type Locale = (typeof routing.locales)[number]
