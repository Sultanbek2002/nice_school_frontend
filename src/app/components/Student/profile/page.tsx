'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Cookies from 'js-cookie'
import { Icon } from '@iconify/react'
import { motion } from 'framer-motion'
import { GO_API_URL } from '@/utils/apiData'

const MD = motion.div as any

interface UserInfo { id: number; email: string; role: string }

interface MyApplication {
  ID: number
  CreatedAt: string
  olympiad_id: number
  fio: string
  school: string
  class_name: string
  status: 'pending' | 'approved' | 'rejected'
  reject_reason: string
  admin_note: string
  olympiad_title: string
  olympiad_subject: string
  olympiad_format: string
  olympiad_status: string
  image_url: string
  start_time: string | null
  olympiad_time_limit: number
}

function decodeJWT(token: string): UserInfo | null {
  try {
    const payload = token.split('.')[1]
    const decoded = JSON.parse(atob(payload))
    return { id: decoded.user_id, email: decoded.email || '', role: decoded.role || 'student' }
  } catch { return null }
}

function getAvatar(email: string) { return email ? email[0].toUpperCase() : '?' }

// Countdown until start_time
function useCountdown(startTime: string | null) {
  const calc = useCallback(() => {
    if (!startTime) return null
    const diff = new Date(startTime).getTime() - Date.now()
    if (diff <= 0) return { started: true, d: 0, h: 0, m: 0, s: 0 }
    const d = Math.floor(diff / 86400000)
    const h = Math.floor((diff % 86400000) / 3600000)
    const m = Math.floor((diff % 3600000) / 60000)
    const s = Math.floor((diff % 60000) / 1000)
    return { started: false, d, h, m, s }
  }, [startTime])

  const [val, setVal] = useState(calc)
  useEffect(() => {
    setVal(calc())
    const t = setInterval(() => setVal(calc()), 1000)
    return () => clearInterval(t)
  }, [calc])
  return val
}

// Per-card countdown component
function Countdown({ startTime }: { startTime: string | null }) {
  const v = useCountdown(startTime)
  if (!startTime || !v) return <span className="text-xs text-slate-400">Убакыт белгиленген жок</span>
  if (v.started) return (
    <span className="inline-flex items-center gap-1 text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />Башталды
    </span>
  )
  const pad = (n: number) => String(n).padStart(2, '0')

  if (v.d > 30) {
    // Show date only for far future
    return (
      <span className="text-xs text-slate-500 font-semibold">
        {new Date(startTime).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
      </span>
    )
  }

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Калды:</span>
      {v.d > 0 && (
        <span className="flex flex-col items-center bg-violet-50 border border-violet-200 rounded-lg px-2 py-0.5 min-w-[32px]">
          <span className="text-sm font-black text-violet-700 leading-none">{v.d}</span>
          <span className="text-[8px] text-violet-400 font-bold uppercase">күн</span>
        </span>
      )}
      <span className="flex flex-col items-center bg-slate-50 border border-slate-200 rounded-lg px-2 py-0.5 min-w-[32px]">
        <span className="text-sm font-black text-slate-700 leading-none">{pad(v.h)}</span>
        <span className="text-[8px] text-slate-400 font-bold uppercase">саат</span>
      </span>
      <span className="text-slate-300 font-black text-xs">:</span>
      <span className="flex flex-col items-center bg-slate-50 border border-slate-200 rounded-lg px-2 py-0.5 min-w-[32px]">
        <span className="text-sm font-black text-slate-700 leading-none">{pad(v.m)}</span>
        <span className="text-[8px] text-slate-400 font-bold uppercase">мин</span>
      </span>
      <span className="text-slate-300 font-black text-xs">:</span>
      <span className="flex flex-col items-center bg-rose-50 border border-rose-200 rounded-lg px-2 py-0.5 min-w-[32px]">
        <span className="text-sm font-black text-rose-600 leading-none">{pad(v.s)}</span>
        <span className="text-[8px] text-rose-400 font-bold uppercase">сек</span>
      </span>
    </div>
  )
}

const STATUS_META = {
  pending:  { label: 'Каралууда',  bg: 'bg-amber-50',  border: 'border-amber-200',  text: 'text-amber-700',  icon: 'solar:clock-circle-bold-duotone',        iconColor: 'text-amber-500' },
  approved: { label: 'Бекитилди', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', icon: 'solar:check-circle-bold-duotone',         iconColor: 'text-emerald-500' },
  rejected: { label: 'Четке',     bg: 'bg-red-50',     border: 'border-red-200',     text: 'text-red-700',    icon: 'solar:close-circle-bold-duotone',         iconColor: 'text-red-500'  },
}

const menuItems = [
  { icon: 'solar:home-2-bold-duotone',    label: 'Башкы бет',   href: '/',          color: 'text-primary'    },
  { icon: 'solar:cup-bold-duotone',       label: 'Олимпиадалар', href: '/olympiads', color: 'text-amber-500'  },
  { icon: 'solar:diploma-bold-duotone',   label: 'Мугалимдер',  href: '/teachers',  color: 'text-emerald-500'},
]

export default function ProfilePage() {
  const [user, setUser] = useState<UserInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [apps, setApps] = useState<MyApplication[]>([])
  const [appsLoading, setAppsLoading] = useState(false)
  const router = useRouter()

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    const token = Cookies.get('auth_token')
    if (!token) { router.push('/'); return }
    const info = decodeJWT(token)
    if (!info) { Cookies.remove('auth_token'); router.push('/'); return }
    setUser(info)
    setLoading(false)

    // Fetch applications
    setAppsLoading(true)
    fetch(`${GO_API_URL}/api/my-applications`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : [])
      .then(d => setApps(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setAppsLoading(false))
  }, [router])

  const handleLogout = () => { Cookies.remove('auth_token'); router.push('/') }

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto" />
        <p className="mt-4 text-gray-400 text-sm font-medium">Жүктөлүүдө...</p>
      </div>
    </div>
  )

  const roleLabel = user?.role === 'student' ? 'Окуучу' : user?.role === 'admin' ? 'Администратор' : user?.role === 'superadmin' ? 'Супер Администратор' : 'Колдонуучу'
  const roleColor = user?.role === 'student' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-amber-50 text-amber-600 border-amber-200'

  const pendingCount  = apps.filter(a => a.status === 'pending').length
  const approvedCount = apps.filter(a => a.status === 'approved').length

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-primary/5 pt-28 pb-16">
      <div className="container mx-auto px-4 max-w-4xl">

        {/* Profile card */}
        <MD initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden mb-6">
          <div className="h-28 bg-gradient-to-r from-primary via-secondary to-primary/70 relative">
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
          </div>
          <div className="px-6 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-10 mb-4">
              <MD initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
                className="w-20 h-20 rounded-2xl bg-white shadow-lg border-4 border-white flex items-center justify-center text-2xl font-black text-white"
                style={{ background: 'linear-gradient(135deg, #6556ff, #1a21bc)' }}>
                {getAvatar(user?.email || '')}
              </MD>
              <button onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-500 rounded-2xl text-sm font-bold border border-red-100 transition-colors cursor-pointer">
                {mounted && <Icon icon="solar:logout-3-bold-duotone" width={18} />}Чыгуу
              </button>
            </div>
            <div className="space-y-1">
              <span className={`inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full border ${roleColor}`}>
                {mounted && <Icon icon="solar:shield-user-bold-duotone" width={12} />}{roleLabel}
              </span>
              <h1 className="text-xl font-black text-midnight_text mt-2">{user?.email}</h1>
            </div>
          </div>
        </MD>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Left sidebar */}
          <MD initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="md:col-span-1 space-y-3">

            {/* Stats */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-4 space-y-2">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 px-1">Статистика</p>
              <div className="flex items-center gap-3 bg-amber-50 p-3 rounded-2xl">
                <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                  {mounted && <Icon icon="solar:cup-bold-duotone" className="text-amber-500 text-lg" />}
                </div>
                <div>
                  <p className="text-lg font-black text-midnight_text leading-none">{apps.length}</p>
                  <p className="text-[10px] text-gray-400 font-medium">Олимпиада өтүнүчтөрү</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-emerald-50 p-3 rounded-2xl">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  {mounted && <Icon icon="solar:check-circle-bold-duotone" className="text-emerald-500 text-lg" />}
                </div>
                <div>
                  <p className="text-lg font-black text-midnight_text leading-none">{approvedCount}</p>
                  <p className="text-[10px] text-gray-400 font-medium">Бекитилген</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl">
                <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                  {mounted && <Icon icon="solar:clock-circle-bold-duotone" className="text-slate-400 text-lg" />}
                </div>
                <div>
                  <p className="text-lg font-black text-midnight_text leading-none">{pendingCount}</p>
                  <p className="text-[10px] text-gray-400 font-medium">Каралууда</p>
                </div>
              </div>
            </div>

            {/* Menu */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-4">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 px-2">Меню</p>
              <nav className="space-y-1">
                {menuItems.map((item, i) => (
                  <Link key={i} href={item.href}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors group">
                    {mounted && <Icon icon={item.icon} className={`text-xl ${item.color} group-hover:scale-110 transition-transform`} />}
                    <span className="text-sm font-semibold text-midnight_text">{item.label}</span>
                    {mounted && <Icon icon="solar:arrow-right-linear" className="ml-auto text-gray-300 group-hover:text-gray-400 text-sm" />}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Account info */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-4">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 px-2">Аккаунт</p>
              <div className="space-y-1">
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-50">
                  {mounted && <Icon icon="solar:id-badge-bold-duotone" className="text-xl text-gray-400" />}
                  <div><p className="text-[10px] text-gray-400 font-medium">ID</p><p className="text-sm font-bold text-midnight_text">#{user?.id}</p></div>
                </div>
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-50">
                  {mounted && <Icon icon="solar:verified-check-bold-duotone" className="text-xl text-green-500" />}
                  <div><p className="text-[10px] text-gray-400 font-medium">Статус</p><p className="text-sm font-bold text-green-600">Активдүү</p></div>
                </div>
              </div>
            </div>
          </MD>

          {/* Right — applications */}
          <MD initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="md:col-span-2 space-y-4">

            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-midnight_text flex items-center gap-2">
                {mounted && <Icon icon="solar:cup-star-bold-duotone" className="text-amber-500 text-xl" />}
                Менин олимпиадаларым
              </h2>
              <Link href="/olympiads"
                className="text-xs font-bold text-primary hover:text-secondary flex items-center gap-1 transition-colors">
                Бардык олимпиадалар
                {mounted && <Icon icon="solar:arrow-right-linear" width={14} />}
              </Link>
            </div>

            {appsLoading ? (
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-10 text-center">
                <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto mb-3" />
                <p className="text-sm text-gray-400 font-medium">Жүктөлүүдө...</p>
              </div>
            ) : apps.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-10 text-center">
                <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-4">
                  {mounted && <Icon icon="solar:cup-bold-duotone" className="text-4xl text-amber-200" />}
                </div>
                <p className="text-slate-500 font-bold text-sm mb-1">Олимпиадага өтүнүч бересиз жок</p>
                <p className="text-xs text-slate-400 mb-4">Катышкыңыз келген олимпиаданы тандаңыз</p>
                <Link href="/olympiads"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-bold rounded-2xl hover:bg-secondary transition-colors shadow-sm shadow-primary/20">
                  {mounted && <Icon icon="solar:cup-bold-duotone" />}Олимпиадаларды көрүү
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {apps.map((app, i) => {
                  const sm = STATUS_META[app.status] || STATUS_META.pending
                  const started = !!(app.start_time && new Date(app.start_time).getTime() <= Date.now())
                  const deadline = app.start_time
                    ? new Date(app.start_time).getTime() + (app.olympiad_time_limit || 60) * 60000
                    : null
                  const closed = deadline != null && Date.now() > deadline
                  return (
                    <MD key={app.ID}
                      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                      className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">

                      {/* Top: image strip + olympiad name */}
                      <div className="flex items-start gap-0">
                        {app.image_url && (
                          <div className="w-24 h-24 flex-shrink-0 relative">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={app.image_url} alt={app.olympiad_title} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="flex-1 p-4 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h3 className="font-black text-sm text-midnight_text leading-snug line-clamp-2">{app.olympiad_title}</h3>
                            <span className={`flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black border ${sm.bg} ${sm.border} ${sm.text}`}>
                              {mounted && <Icon icon={sm.icon} width={12} className={sm.iconColor} />}{sm.label}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 font-semibold">
                            <span className="flex items-center gap-1">{mounted && <Icon icon="solar:book-bold-duotone" width={11} />}{app.olympiad_subject}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              {mounted && <Icon icon={app.olympiad_format === 'Онлайн' ? 'solar:monitor-bold-duotone' : 'solar:map-point-bold-duotone'} width={11} />}
                              {app.olympiad_format}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Bottom: countdown + status detail */}
                      <div className={`px-4 py-3 border-t ${sm.border} ${sm.bg} space-y-2`}>
                        {/* Countdown — hidden once the test window has closed */}
                        {!closed && (
                          <div className="flex items-center gap-2">
                            {mounted && <Icon icon="solar:hourglass-bold-duotone" width={14} className={sm.iconColor} />}
                            <Countdown startTime={app.start_time} />
                          </div>
                        )}

                        {/* Status messages */}
                        {app.status === 'pending' && (
                          <p className="text-[11px] text-amber-600 font-semibold flex items-center gap-1">
                            {mounted && <Icon icon="solar:info-circle-bold-duotone" width={12} />}
                            Администратор маалыматтарыңызды текшерет, күтүп туруңуз
                          </p>
                        )}
                        {app.status === 'approved' && !started && (
                          <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                            {mounted && <Icon icon="solar:check-circle-bold-duotone" width={12} />}
                            Катышуу бекитилди! Убакыт жеткенде тестке кириңиз
                          </p>
                        )}
                        {app.status === 'rejected' && app.reject_reason && (
                          <p className="text-[11px] text-red-600 font-semibold flex items-center gap-1">
                            {mounted && <Icon icon="solar:danger-circle-bold-duotone" width={12} />}
                            Себеп: {app.reject_reason}
                          </p>
                        )}

                        {/* Test entry button — shown when approved, started, and still within the time window */}
                        {app.status === 'approved' && started && !closed && (
                          <Link href={`/olympiads/${app.olympiad_id}/test`}
                            className="inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black transition-all hover:scale-[1.01] active:scale-[0.99] shadow-sm shadow-emerald-200">
                            {mounted && <Icon icon="solar:play-circle-bold-duotone" width={14} />}
                            Тестке кирүү
                          </Link>
                        )}

                        {app.status === 'approved' && started && closed && (
                          <p className="text-sm text-slate-600 font-black flex items-center gap-1.5">
                            {mounted && <Icon icon="solar:lock-circle-bold-duotone" width={16} />}
                            Олимпиаданын убактысы аяктады
                          </p>
                        )}

                        {/* Link to olympiad page */}
                        <Link href={`/olympiads/${app.olympiad_id}`}
                          className={`inline-flex items-center gap-1 text-[11px] font-black ${sm.text} hover:underline underline-offset-2`}>
                          Олимпиада барагына өтүү
                          {mounted && <Icon icon="solar:arrow-right-up-linear" width={11} />}
                        </Link>
                      </div>
                    </MD>
                  )
                })}
              </div>
            )}
          </MD>
        </div>
      </div>
    </div>
  )
}
