// Страница «Учебные кабинеты» — клиентский компонент, а у таких страниц заголовок задаётся отсюда.
import { pageMetadata } from '@/utils/seo'

export const metadata = pageMetadata({
  title: 'Учебные кабинеты',
  description:
    'Учебные кабинеты NICE International School: как выглядят классы и какие педагоги в них работают.',
  path: '/school-tour/cabinets',
})

export default function CabinetsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
