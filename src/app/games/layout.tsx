// Страница «Обучающие игры» — клиентский компонент, а у таких страниц заголовок задаётся отсюда.
import { pageMetadata } from '@/utils/seo'

export const metadata = pageMetadata({
  title: 'Обучающие игры',
  description:
    'Развивающие обучающие игры от NICE International School: тренируйте знания в игровой форме, прямо в браузере.',
  path: '/games',
  hasChildren: true,
})

export default function GamesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
