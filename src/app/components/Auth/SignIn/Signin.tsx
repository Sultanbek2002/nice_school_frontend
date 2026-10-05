'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Icon } from '@iconify/react'
import { motion } from 'framer-motion'
import Cookies from 'js-cookie'
import { GO_API_URL } from '@/utils/apiData'

const MD = motion.div as any
const MButton = motion.button as any

interface SigninProps {
  onClose?: () => void
}

// login — вход, forgot — запрос кода на email, reset — ввод кода и нового пароля
type Mode = 'login' | 'forgot' | 'reset'

export default function Signin({ onClose }: SigninProps) {
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)
  const [lockoutDisplay, setLockoutDisplay] = useState(0)
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null)

  useEffect(() => {
    if (!lockoutUntil) return
    const tick = () => {
      const rem = Math.ceil((lockoutUntil - Date.now()) / 1000)
      if (rem <= 0) {
        setLockoutDisplay(0)
        setLockoutUntil(null)
        setError('')
      } else {
        setLockoutDisplay(rem)
      }
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [lockoutUntil])

  const isLocked = lockoutDisplay > 0
  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  const switchMode = (m: Mode) => {
    setMode(m)
    setError('')
    setInfo('')
    setShowPassword(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isLocked) return
    setError('')
    setLoading(true)

    try {
      const res = await fetch(`${GO_API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.retry_after) {
          const secs = Number(data.retry_after)
          setLockoutUntil(Date.now() + secs * 1000)
          setLockoutDisplay(secs)
        } else {
          setError(data.error || 'Кирүүдө ката кетти')
        }
        return
      }

      Cookies.set('auth_token', data.token, { expires: 7, path: '/' })

      if (data.role === 'student') window.location.href = '/student'
      else if (data.role === 'admin' || data.role === 'superadmin') window.location.href = '/admin/dashboard'
      else window.location.href = '/'
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Отправка кода на email. Бэкенд всегда отвечает одинаково (не раскрывает, есть ли аккаунт),
  // поэтому здесь успех = запрос принят, без проверки существования аккаунта.
  const requestCode = async (): Promise<boolean> => {
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`${GO_API_URL}/api/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || 'Не удалось отправить код. Попробуйте ещё раз')
        return false
      }
      return true
    } catch {
      setError('Нет связи с сервером. Попробуйте ещё раз')
      return false
    } finally {
      setLoading(false)
    }
  }

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault()
    if (await requestCode()) {
      setInfo('Если аккаунт с таким email существует, мы отправили на него 6-значный код')
      setMode('reset')
    }
  }

  const handleResend = async () => {
    if (await requestCode()) setInfo('Код отправлен повторно')
  }

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (newPassword.length < 8) {
      setError('Новый пароль должен быть не короче 8 символов')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Пароли не совпадают')
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`${GO_API_URL}/api/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, password: newPassword }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || 'Не удалось сменить пароль. Попробуйте ещё раз')
        return
      }
      // Пароль сменён — возвращаем на вход с уже заполненным email, без автологина
      setCode('')
      setNewPassword('')
      setConfirmPassword('')
      setPassword('')
      setMode('login')
      setInfo('Пароль успешно изменён! Войдите с новым паролем.')
    } catch {
      setError('Нет связи с сервером. Попробуйте ещё раз')
    } finally {
      setLoading(false)
    }
  }

  const title = mode === 'login' ? 'Кош келиңиз!' : mode === 'forgot' ? 'Сброс пароля' : 'Новый пароль'
  const subtitle =
    mode === 'login' ? 'Аккаунтуңузга кириңиз'
    : mode === 'forgot' ? 'Введите email, и мы отправим код для сброса пароля'
    : `Код отправлен на ${email}`

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-primary/5 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        <MD
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="glass-card rounded-3xl p-8 md:p-10"
        >
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
              <Icon
                icon={mode === 'login' ? 'solar:shield-user-bold-duotone' : 'solar:key-bold-duotone'}
                className="text-3xl text-primary"
              />
            </div>
            <h1 className="text-2xl font-black text-midnight_text">{title}</h1>
            <p className="text-gray-400 text-sm mt-1">{subtitle}</p>
          </div>

          {/* Блокировка с таймером (только при входе) */}
          {isLocked && (
            <MD
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 p-4 bg-orange-50 border border-orange-200 rounded-2xl text-center"
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                <Icon icon="solar:lock-bold-duotone" className="text-orange-500 text-2xl" />
                <span className="text-orange-700 font-bold text-sm">Аккаунт убактылуу бөгөттөлдү</span>
              </div>
              <div className="text-3xl font-black text-orange-600 tabular-nums">
                {formatTime(lockoutDisplay)}
              </div>
              <p className="text-orange-500 text-xs mt-1">убакыт өткөндөн кийин кайра аракет кылыңыз</p>
            </MD>
          )}

          {/* Успешное действие (пароль изменён / код отправлен) */}
          {info && !isLocked && (
            <MD
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 flex items-center gap-2.5 p-3.5 bg-emerald-50 border border-emerald-100 rounded-2xl"
            >
              <Icon icon="solar:check-circle-bold" className="text-emerald-500 text-xl flex-shrink-0" />
              <p className="text-emerald-700 text-sm font-medium">{info}</p>
            </MD>
          )}

          {/* Обычная ошибка */}
          {error && !isLocked && (
            <MD
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 flex items-center gap-2.5 p-3.5 bg-red-50 border border-red-100 rounded-2xl"
            >
              <Icon icon="solar:danger-circle-bold" className="text-red-500 text-xl flex-shrink-0" />
              <p className="text-red-600 text-sm font-medium">{error}</p>
            </MD>
          )}

          {/* ── ВХОД ── */}
          {mode === 'login' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <Icon icon="solar:letter-bold-duotone" className="text-xl" />
                </div>
                <input
                  type="email"
                  placeholder="Email дарегиңиз"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLocked}
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 bg-slate-50 text-midnight_text placeholder:text-gray-400 focus:outline-none focus:border-primary focus:bg-white transition-all duration-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <Icon icon="solar:lock-password-bold-duotone" className="text-xl" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Пароль"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLocked}
                  className="w-full pl-12 pr-12 py-3.5 rounded-2xl border border-slate-200 bg-slate-50 text-midnight_text placeholder:text-gray-400 focus:outline-none focus:border-primary focus:bg-white transition-all duration-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
                >
                  <Icon icon={showPassword ? 'solar:eye-closed-bold' : 'solar:eye-bold'} className="text-xl" />
                </button>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => switchMode('forgot')}
                  className="text-xs font-bold text-primary hover:underline"
                >
                  Забыли пароль?
                </button>
              </div>

              <MButton
                type="submit"
                disabled={loading || isLocked}
                whileHover={{ scale: (loading || isLocked) ? 1 : 1.01 }}
                whileTap={{ scale: (loading || isLocked) ? 1 : 0.98 }}
                className="relative w-full py-3.5 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/25 hover:bg-secondary transition-colors duration-300 disabled:opacity-60 disabled:cursor-not-allowed overflow-hidden text-sm mt-2"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Icon icon="svg-spinners:ring-resize" className="text-lg" />
                    Кирүүдө...
                  </span>
                ) : isLocked ? (
                  <span className="flex items-center justify-center gap-2">
                    <Icon icon="solar:lock-bold" className="text-lg" />
                    {formatTime(lockoutDisplay)} — Бөгөттөлгөн
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Icon icon="solar:login-bold" className="text-lg" />
                    Кирүү
                  </span>
                )}
                <span className="absolute inset-0 -translate-x-full hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              </MButton>
            </form>
          )}

          {/* ── ЗАПРОС КОДА ── */}
          {mode === 'forgot' && (
            <form onSubmit={handleForgot} className="space-y-4">
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <Icon icon="solar:letter-bold-duotone" className="text-xl" />
                </div>
                <input
                  type="email"
                  placeholder="Ваш email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 bg-slate-50 text-midnight_text placeholder:text-gray-400 focus:outline-none focus:border-primary focus:bg-white transition-all duration-300 text-sm"
                />
              </div>

              <MButton
                type="submit"
                disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.01 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                className="w-full py-3.5 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/25 hover:bg-secondary transition-colors duration-300 disabled:opacity-60 disabled:cursor-not-allowed text-sm mt-2"
              >
                {loading ? 'Отправка...' : 'Отправить код'}
              </MButton>

              <button
                type="button"
                onClick={() => switchMode('login')}
                className="w-full text-sm text-gray-400 hover:text-primary transition-colors flex items-center justify-center gap-1 pt-1"
              >
                <Icon icon="solar:arrow-left-linear" />
                Назад ко входу
              </button>
            </form>
          )}

          {/* ── ВВОД КОДА И НОВОГО ПАРОЛЯ ── */}
          {mode === 'reset' && (
            <form onSubmit={handleReset} className="space-y-4">
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="6-значный код"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  autoFocus
                  className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 bg-slate-50 text-midnight_text text-center text-lg font-black tracking-[0.5em] placeholder:text-gray-400 placeholder:text-sm placeholder:font-normal placeholder:tracking-normal focus:outline-none focus:border-primary focus:bg-white transition-all duration-300"
                />
              </div>

              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <Icon icon="solar:lock-password-bold-duotone" className="text-xl" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Новый пароль (минимум 8 символов)"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="w-full pl-12 pr-12 py-3.5 rounded-2xl border border-slate-200 bg-slate-50 text-midnight_text placeholder:text-gray-400 focus:outline-none focus:border-primary focus:bg-white transition-all duration-300 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
                >
                  <Icon icon={showPassword ? 'solar:eye-closed-bold' : 'solar:eye-bold'} className="text-xl" />
                </button>
              </div>

              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <Icon icon="solar:lock-password-bold-duotone" className="text-xl" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Повторите новый пароль"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 bg-slate-50 text-midnight_text placeholder:text-gray-400 focus:outline-none focus:border-primary focus:bg-white transition-all duration-300 text-sm"
                />
              </div>

              <MButton
                type="submit"
                disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.01 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                className="w-full py-3.5 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/25 hover:bg-secondary transition-colors duration-300 disabled:opacity-60 disabled:cursor-not-allowed text-sm mt-2"
              >
                {loading ? 'Сохранение...' : 'Сохранить новый пароль'}
              </MButton>

              <div className="flex items-center justify-between text-sm pt-1">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={loading}
                  className="text-primary font-bold hover:underline disabled:opacity-50"
                >
                  Отправить код ещё раз
                </button>
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="text-gray-400 hover:text-primary transition-colors"
                >
                  Назад ко входу
                </button>
              </div>
            </form>
          )}

          {mode === 'login' && (
            <>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-100" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-3 text-xs text-gray-400">же</span>
                </div>
              </div>

              <p className="text-center text-sm text-gray-500">
                Аккаунтуңуз жокпу?{' '}
                <Link href="/signup" onClick={onClose} className="text-primary font-bold hover:underline">
                  Катталуу
                </Link>
              </p>
            </>
          )}
        </MD>

        <p className="text-center mt-4">
          <Link href="/" className="text-sm text-gray-400 hover:text-primary transition-colors flex items-center justify-center gap-1">
            <Icon icon="solar:arrow-left-linear" />
            Башкы бетке кайтуу
          </Link>
        </p>
      </div>
    </div>
  )
}
