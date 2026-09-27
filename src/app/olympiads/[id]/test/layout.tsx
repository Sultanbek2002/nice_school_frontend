import type { Viewport } from 'next'
import { pageMetadata } from '@/utils/seo'

// Prevents iOS Safari auto-zoom on input focus for the test page
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

// Приватная страница (прохождение теста): не должна попадать в поисковую выдачу.
export const metadata = pageMetadata({ title: 'Тест олимпиады', path: '/olympiads', noindex: true })

export default function TestLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
