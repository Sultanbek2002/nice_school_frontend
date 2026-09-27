// Страница «Учебные материалы» — клиентский компонент, а у таких страниц заголовок задаётся отсюда.
import { pageMetadata } from '@/utils/seo'

export const metadata = pageMetadata({
  title: 'Учебные материалы',
  description:
    'Интерактивные уроки и презентации по школьным предметам: слайды, задания и электронная доска для занятий онлайн.',
  path: '/resources',
})

export default function ResourcesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
