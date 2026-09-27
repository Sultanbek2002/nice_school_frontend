// Приватная страница: не должна попадать в поисковую выдачу.
import { pageMetadata } from '@/utils/seo'

export const metadata = pageMetadata({ title: 'Анкета учителя', path: '/teacher-form', noindex: true })

export default function TeacherFormLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
