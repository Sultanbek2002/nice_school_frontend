// Страница «Рейтинг учеников» — клиентский компонент, а у таких страниц заголовок задаётся отсюда.
import { pageMetadata } from '@/utils/seo'

export const metadata = pageMetadata({
  title: 'Рейтинг учеников',
  description:
    'Рейтинг учеников NICE International School: лучшие результаты по классам.',
  path: '/rating',
})

export default function RatingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
