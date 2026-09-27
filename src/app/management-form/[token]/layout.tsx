// Приватная страница: не должна попадать в поисковую выдачу.
import { pageMetadata } from '@/utils/seo'

export const metadata = pageMetadata({ title: 'Анкета сотрудника', path: '/management-form', noindex: true })

export default function ManagementFormLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
