// Страница «Тур по школе» — клиентский компонент, а у таких страниц заголовок задаётся отсюда.
import { pageMetadata } from '@/utils/seo'

export const metadata = pageMetadata({
  title: 'Тур по школе',
  description:
    'Виртуальный тур по NICE International School в Оше: посмотрите здание, интерьеры и учебные кабинеты, не выходя из дома.',
  path: '/school-tour',
  hasChildren: true,
})

export default function SchoolTourLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
