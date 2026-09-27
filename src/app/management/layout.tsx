// Страница «Руководство школы» — клиентский компонент, а у таких страниц заголовок задаётся отсюда.
import { pageMetadata } from '@/utils/seo'

export const metadata = pageMetadata({
  title: 'Руководство школы',
  description:
    'Директор и команда управления NICE International School: образование, опыт и миссия руководителей школы.',
  path: '/management',
})

export default function ManagementLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
