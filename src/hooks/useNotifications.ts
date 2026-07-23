'use client'

import { useEffect, useRef, useState } from 'react'
import Cookies from 'js-cookie'
import { GO_API_URL } from '@/utils/apiData'

export interface Notification {
  ID: number
  CreatedAt: string
  type: string
  title: string
  body: string
  link: string
  is_read: boolean
}

const POLL_INTERVAL = 30_000 // 30s

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const token = Cookies.get('auth_token')

  const fetch_ = async () => {
    if (!token) return
    try {
      const res = await fetch(`${GO_API_URL}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return
      const data = await res.json()
      setNotifications(data.notifications ?? [])
      setUnreadCount(data.unread_count ?? 0)
    } catch {}
  }

  useEffect(() => {
    if (!token) return
    fetch_()
    timerRef.current = setInterval(fetch_, POLL_INTERVAL)

    const onFocus = () => fetch_()
    document.addEventListener('visibilitychange', onFocus)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      document.removeEventListener('visibilitychange', onFocus)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  const markRead = async (id: number) => {
    if (!token) return
    setNotifications(prev => prev.filter(n => n.ID !== id))
    setUnreadCount(prev => Math.max(0, prev - 1))
    await fetch(`${GO_API_URL}/api/notifications/${id}/read`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    })
  }

  const markAllRead = async () => {
    if (!token) return
    setNotifications([])
    setUnreadCount(0)
    await fetch(`${GO_API_URL}/api/notifications/read-all`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    })
  }

  return { notifications, unreadCount, markRead, markAllRead, refresh: fetch_ }
}
