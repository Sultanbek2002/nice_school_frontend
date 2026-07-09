import type { Viewport } from 'next'

// Prevents iOS Safari auto-zoom on input focus for the test page
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function TestLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
