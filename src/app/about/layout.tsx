// Страница «О школе» — клиентский компонент, а у таких страниц заголовок задаётся отсюда.
import { pageMetadata } from '@/utils/seo'

export const metadata = pageMetadata({
  title: 'О школе',
  description:
    'История, миссия, программы обучения, кампус и условия поступления в NICE International School в Оше. Узнайте, почему семьи выбирают нас.',
  path: '/about',
})

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
