// Страница «Олимпиады» — клиентский компонент, а у таких страниц заголовок задаётся отсюда.
import { pageMetadata } from '@/utils/seo'

export const metadata = pageMetadata({
  title: 'Олимпиады',
  description:
    'Школьные олимпиады NICE International School: расписание, регистрация, результаты и призы для учеников. Участвуйте онлайн.',
  path: '/olympiads',
  hasChildren: true,
})

export default function OlympiadsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
