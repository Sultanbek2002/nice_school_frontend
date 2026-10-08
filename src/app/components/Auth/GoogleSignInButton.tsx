'use client'

import { useEffect, useRef, useState } from 'react'
import Cookies from 'js-cookie'
import { GO_API_URL } from '@/utils/apiData'

declare global {
  interface Window {
    google?: any
  }
}

// Публичный Client ID — задаётся в сборке через NEXT_PUBLIC_GOOGLE_CLIENT_ID.
// Пока его нет, кнопка просто не рендерится (не ломает страницу входа/регистрации).
const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

interface GoogleSignInButtonProps {
  onError?: (msg: string) => void
}

export default function GoogleSignInButton({ onError }: GoogleSignInButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!CLIENT_ID) return

    const handleCredential = async (resp: { credential: string }) => {
      setBusy(true)
      try {
        const res = await fetch(`${GO_API_URL}/api/auth/google`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ credential: resp.credential }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
          onError?.(data.error || 'Не удалось войти через Google')
          return
        }
        Cookies.set('auth_token', data.token, { expires: 7, path: '/' })
        if (data.role === 'student') window.location.href = '/student'
        else if (data.role === 'admin' || data.role === 'superadmin') window.location.href = '/admin/dashboard'
        else window.location.href = '/'
      } catch {
        onError?.('Нет связи с сервером. Попробуйте ещё раз')
      } finally {
        setBusy(false)
      }
    }

    const renderButton = () => {
      if (!window.google || !containerRef.current) return
      window.google.accounts.id.initialize({ client_id: CLIENT_ID, callback: handleCredential })
      const width = Math.min(containerRef.current.offsetWidth || 320, 400)
      window.google.accounts.id.renderButton(containerRef.current, {
        type: 'standard', theme: 'outline', size: 'large', width, text: 'continue_with',
      })
    }

    if (window.google) {
      renderButton()
      return
    }
    const script = document.createElement('script')
    // hl=ru — язык текста самой кнопки/попапа Google; параметр locale у renderButton его не задаёт
    script.src = 'https://accounts.google.com/gsi/client?hl=ru'
    script.async = true
    script.defer = true
    script.onload = renderButton
    document.head.appendChild(script)
  }, [onError])

  if (!CLIENT_ID) return null

  return <div ref={containerRef} className={`flex justify-center ${busy ? 'opacity-50 pointer-events-none' : ''}`} />
}
