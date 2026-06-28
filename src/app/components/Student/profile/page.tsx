'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Cookies from 'js-cookie'
import { Icon } from '@iconify/react'
import { motion } from 'framer-motion'

const MD = motion.div as any
const MButton = motion.button as any

interface UserInfo {
  id: number
  email: string
  role: string
}

function decodeJWT(token: string): UserInfo | null {
  try {
    const payload = token.split('.')[1]
    const decoded = JSON.parse(atob(payload))
    return {
      id: decoded.user_id,
      email: decoded.email || '',
      role: decoded.role || 'student',
    }
  } catch {
    return null
  }
}

function getAvatar(email: string) {
  return email ? email[0].toUpperCase() : '?'
}

const menuItems = [
  { icon: 'solar:home-2-bold-duotone', label: 'Башкы бет', href: '/', color: 'text-primary' },
  { icon: 'solar:book-2-bold-duotone', label: 'Курстар', href: '/courses', color: 'text-blue-500' },
  { icon: 'solar:cup-bold-duotone', label: 'Олимпиадалар', href: '/olympiads', color: 'text-amber-500' },
  { icon: 'solar:diploma-bold-duotone', label: 'Мугалимдер', href: '/teachers', color: 'text-emerald-500' },
]

const stats = [
  { icon: 'solar:book-bold-duotone', label: 'Курстар', value: '—', color: 'bg-primary/10 text-primary' },
  { icon: 'solar:cup-bold-duotone', label: 'Олимпиадалар', value: '—', color: 'bg-amber-50 text-amber-500' },
  { icon: 'solar:star-bold-duotone', label: 'Жетишкендик', value: '—', color: 'bg-emerald-50 text-emerald-500' },
]

export default function ProfilePage() {
  const [user, setUser] = useState<UserInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const token = Cookies.get('auth_token')
    if (!token) {
      router.push('/')
      return
    }
    const info = decodeJWT(token)
    if (!info) {
      Cookies.remove('auth_token')
      router.push('/')
      return
    }
    setUser(info)
    setLoading(false)
  }, [router])

  const handleLogout = () => {
    Cookies.remove('auth_token')
    router.push('/')
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto" />
          <p className="mt-4 text-gray-400 text-sm font-medium">Жүктөлүүдө...</p>
        </div>
      </div>
    )
  }

  const roleLabel = user?.role === 'student' ? 'Окуучу'
    : user?.role === 'admin' ? 'Администратор'
    : user?.role === 'superadmin' ? 'Супер Администратор'
    : user?.role || 'Колдонуучу'

  const roleColor = user?.role === 'student'
    ? 'bg-primary/10 text-primary border-primary/20'
    : 'bg-amber-50 text-amber-600 border-amber-200'

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-primary/5 pt-28 pb-16">
      <div className="container mx-auto px-4 max-w-4xl">

        {/* Верхняя карточка профиля */}
        <MD
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden mb-6"
        >
          {/* Шапка с градиентом */}
          <div className="h-28 bg-gradient-to-r from-primary via-secondary to-primary/70 relative">
            <div className="absolute inset-0 opacity-20"
              style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '30px 30px' }}
            />
          </div>

          <div className="px-6 pb-6">
            {/* Аватар */}
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-10 mb-4">
              <MD
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
                className="w-20 h-20 rounded-2xl bg-white shadow-lg border-4 border-white flex items-center justify-center text-2xl font-black text-white relative"
                style={{ background: 'linear-gradient(135deg, #6556ff, #1a21bc)' }}
              >
                {getAvatar(user?.email || '')}
              </MD>

              <MButton
                onClick={handleLogout}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-500 rounded-2xl text-sm font-bold border border-red-100 transition-colors cursor-pointer"
              >
                <Icon icon="solar:logout-3-bold-duotone" width={18} />
                Чыгуу
              </MButton>
            </div>

            {/* Инфо */}
            <div className="space-y-1">
              <span className={`inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full border ${roleColor}`}>
                <Icon icon="solar:shield-user-bold-duotone" width={12} />
                {roleLabel}
              </span>
              <h1 className="text-xl font-black text-midnight_text mt-2">
                {user?.email}
              </h1>
            </div>
          </div>
        </MD>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Левая колонка — навигация */}
          <MD
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="md:col-span-1 space-y-3"
          >
            {/* Меню */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-4">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 px-2">Меню</p>
              <nav className="space-y-1">
                {menuItems.map((item, i) => (
                  <Link
                    key={i}
                    href={item.href}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors group"
                  >
                    <Icon icon={item.icon} className={`text-xl ${item.color} group-hover:scale-110 transition-transform`} />
                    <span className="text-sm font-semibold text-midnight_text">{item.label}</span>
                    <Icon icon="solar:arrow-right-linear" className="ml-auto text-gray-300 group-hover:text-gray-400 text-sm" />
                  </Link>
                ))}
              </nav>
            </div>

            {/* Аккаунт */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-4">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 px-2">Аккаунт</p>
              <div className="space-y-1">
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-50">
                  <Icon icon="solar:id-badge-bold-duotone" className="text-xl text-gray-400" />
                  <div>
                    <p className="text-[10px] text-gray-400 font-medium">ID</p>
                    <p className="text-sm font-bold text-midnight_text">#{user?.id}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-50">
                  <Icon icon="solar:verified-check-bold-duotone" className="text-xl text-green-500" />
                  <div>
                    <p className="text-[10px] text-gray-400 font-medium">Статус</p>
                    <p className="text-sm font-bold text-green-600">Активдүү</p>
                  </div>
                </div>
              </div>
            </div>
          </MD>

          {/* Правая колонка */}
          <MD
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="md:col-span-2 space-y-6"
          >
            {/* Статистика */}
            <div className="grid grid-cols-3 gap-3">
              {stats.map((s, i) => (
                <MD
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 + i * 0.08 }}
                  className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 text-center"
                >
                  <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl ${s.color} mb-2`}>
                    <Icon icon={s.icon} className="text-xl" />
                  </div>
                  <p className="text-xl font-black text-midnight_text">{s.value}</p>
                  <p className="text-[11px] text-gray-400 font-medium mt-0.5">{s.label}</p>
                </MD>
              ))}
            </div>

            {/* Менин курстарым */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
              <h2 className="text-base font-black text-midnight_text flex items-center gap-2 mb-4">
                <Icon icon="solar:book-2-bold-duotone" className="text-primary text-xl" />
                Менин курстарым
              </h2>
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-14 h-14 rounded-2xl bg-primary/8 flex items-center justify-center mb-3">
                  <Icon icon="solar:book-2-bold-duotone" className="text-3xl text-primary/40" />
                </div>
                <p className="text-gray-400 text-sm font-medium">Азырынча курстарга жазылган жоксуз</p>
                <Link
                  href="/courses"
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-bold rounded-xl hover:bg-secondary transition-colors shadow-sm shadow-primary/20"
                >
                  <Icon icon="solar:add-circle-bold" />
                  Курс тандоо
                </Link>
              </div>
            </div>

            {/* Кулактандыруулар */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
              <h2 className="text-base font-black text-midnight_text flex items-center gap-2 mb-4">
                <Icon icon="solar:bell-bing-bold-duotone" className="text-amber-500 text-xl" />
                Кулактандыруулар
              </h2>
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <Icon icon="solar:bell-off-bold-duotone" className="text-4xl text-gray-200 mb-2" />
                <p className="text-gray-400 text-sm font-medium">Жаңы кулактандыруулар жок</p>
              </div>
            </div>
          </MD>
        </div>
      </div>
    </div>
  )
}
