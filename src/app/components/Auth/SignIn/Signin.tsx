'use client'

import React, { useState } from 'react'
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

export default function Signin({ onClose }: SigninProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch(`${GO_API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Кирүүдө ката кетти')

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-primary/5 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        {/* Карточка */}
        <MD
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="glass-card rounded-3xl p-8 md:p-10"
        >
          {/* Логотип / иконка */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
              <Icon icon="solar:shield-user-bold-duotone" className="text-3xl text-primary" />
            </div>
            <h1 className="text-2xl font-black text-midnight_text">Кош келиңиз!</h1>
            <p className="text-gray-400 text-sm mt-1">Аккаунтуңузга кириңиз</p>
          </div>

          {/* Ошибка */}
          {error && (
            <MD
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 flex items-center gap-2.5 p-3.5 bg-red-50 border border-red-100 rounded-2xl"
            >
              <Icon icon="solar:danger-circle-bold" className="text-red-500 text-xl flex-shrink-0" />
              <p className="text-red-600 text-sm font-medium">{error}</p>
            </MD>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
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
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 bg-slate-50 text-midnight_text placeholder:text-gray-400 focus:outline-none focus:border-primary focus:bg-white transition-all duration-300 text-sm"
              />
            </div>

            {/* Пароль */}
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <Icon icon="solar:lock-password-bold-duotone" className="text-xl" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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

            {/* Кнопка */}
            <MButton
              type="submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.01 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              className="relative w-full py-3.5 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/25 hover:bg-secondary transition-colors duration-300 disabled:opacity-60 overflow-hidden text-sm mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Icon icon="svg-spinners:ring-resize" className="text-lg" />
                  Кирүүдө...
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

          {/* Разделитель */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-xs text-gray-400">же</span>
            </div>
          </div>

          {/* Ссылка на регистрацию */}
          <p className="text-center text-sm text-gray-500">
            Аккаунтуңуз жокпу?{' '}
            <Link
              href="/signup"
              onClick={onClose}
              className="text-primary font-bold hover:underline"
            >
              Катталуу
            </Link>
          </p>
        </MD>

        {/* Ссылка назад */}
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
