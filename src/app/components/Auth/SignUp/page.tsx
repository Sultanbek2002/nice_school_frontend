'use client'

import React, { useState, useRef } from 'react'
import Link from 'next/link'
import { Icon } from '@iconify/react'
import { motion, AnimatePresence } from 'framer-motion'
import Cookies from 'js-cookie'
import { GO_API_URL } from '@/utils/apiData'

const MD = motion.div as any
const MButton = motion.button as any

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
  exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0, transition: { duration: 0.25 } }),
}

export default function SignUpPage() {
  const [step, setStep] = useState(1) // 1: форма, 2: OTP, 3: успех
  const [dir, setDir] = useState(1)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])

  const goTo = (next: number) => {
    setDir(next > step ? 1 : -1)
    setStep(next)
    setError('')
  }

  // Шаг 1 → отправить OTP
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Паролдор бири-бирине дал келген жок')
      return
    }
    if (password.length < 6) {
      setError('Пароль минимум 6 белгиден турушу керек')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`${GO_API_URL}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Ката кетти')
      goTo(2)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Шаг 2 → верификация OTP
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const code = otp.join('')
    if (code.length < 6) {
      setError('6 орундуу кодду киргизиңиз')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`${GO_API_URL}/api/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Код туура эмес')
      if (data.token) Cookies.set('auth_token', data.token, { expires: 7, path: '/' })
      goTo(3)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // OTP input — авто переход между ячейками
  const handleOtpChange = (i: number, val: string) => {
    if (!/^\d*$/.test(val)) return
    const next = [...otp]
    next[i] = val.slice(-1)
    setOtp(next)
    if (val && i < 5) otpRefs.current[i + 1]?.focus()
  }

  const handleOtpKey = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus()
  }

  const handleResend = async () => {
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`${GO_API_URL}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setOtp(['', '', '', '', '', ''])
      otpRefs.current[0]?.focus()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const steps = [
    { icon: 'solar:user-bold-duotone', label: 'Маалымат' },
    { icon: 'solar:shield-check-bold-duotone', label: 'Код' },
    { icon: 'solar:check-circle-bold-duotone', label: 'Даяр' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-primary/5 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        <MD
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="bg-white rounded-3xl shadow-xl shadow-primary/8 border border-slate-100 p-8 md:p-10 overflow-hidden"
        >
          {/* Прогресс-шаги */}
          <div className="flex items-center justify-center gap-3 mb-8">
            {steps.map((s, i) => {
              const n = i + 1
              const active = step === n
              const done = step > n
              return (
                <React.Fragment key={i}>
                  <div className="flex flex-col items-center gap-1">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                      done ? 'bg-green-500' : active ? 'bg-primary' : 'bg-slate-100'
                    }`}>
                      <Icon
                        icon={done ? 'solar:check-bold' : s.icon}
                        className={`text-xl ${done || active ? 'text-white' : 'text-gray-400'}`}
                      />
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${
                      active ? 'text-primary' : done ? 'text-green-500' : 'text-gray-300'
                    }`}>{s.label}</span>
                  </div>
                  {i < 2 && (
                    <div className={`flex-1 h-0.5 mb-5 rounded-full transition-all duration-500 ${step > n ? 'bg-green-400' : 'bg-slate-100'}`} />
                  )}
                </React.Fragment>
              )
            })}
          </div>

          {/* Контент шагов */}
          <AnimatePresence mode="wait" custom={dir}>
            {step === 1 && (
              <MD key="step1" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit">
                <div className="text-center mb-6">
                  <h2 className="text-xl font-black text-midnight_text">Каттоо</h2>
                  <p className="text-gray-400 text-sm mt-1">Маалыматтарыңызды киргизиңиз</p>
                </div>

                {error && (
                  <div className="mb-4 flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-2xl">
                    <Icon icon="solar:danger-circle-bold" className="text-red-500 text-lg flex-shrink-0" />
                    <p className="text-red-600 text-xs font-medium">{error}</p>
                  </div>
                )}

                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="relative">
                    <Icon icon="solar:letter-bold-duotone" className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-gray-400" />
                    <input
                      type="email"
                      placeholder="Email дарегиңиз"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 bg-slate-50 text-midnight_text placeholder:text-gray-400 focus:outline-none focus:border-primary focus:bg-white transition-all text-sm"
                    />
                  </div>

                  <div className="relative">
                    <Icon icon="solar:lock-password-bold-duotone" className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Пароль (минимум 6 белги)"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full pl-12 pr-12 py-3.5 rounded-2xl border border-slate-200 bg-slate-50 text-midnight_text placeholder:text-gray-400 focus:outline-none focus:border-primary focus:bg-white transition-all text-sm"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary">
                      <Icon icon={showPassword ? 'solar:eye-closed-bold' : 'solar:eye-bold'} className="text-xl" />
                    </button>
                  </div>

                  <div className="relative">
                    <Icon icon="solar:lock-keyhole-bold-duotone" className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-gray-400" />
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      placeholder="Паролду кайталаңыз"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="w-full pl-12 pr-12 py-3.5 rounded-2xl border border-slate-200 bg-slate-50 text-midnight_text placeholder:text-gray-400 focus:outline-none focus:border-primary focus:bg-white transition-all text-sm"
                    />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary">
                      <Icon icon={showConfirm ? 'solar:eye-closed-bold' : 'solar:eye-bold'} className="text-xl" />
                    </button>
                  </div>

                  {/* Индикатор совпадения */}
                  {confirmPassword && (
                    <div className={`flex items-center gap-2 text-xs font-medium px-1 ${password === confirmPassword ? 'text-green-500' : 'text-red-400'}`}>
                      <Icon icon={password === confirmPassword ? 'solar:check-circle-bold' : 'solar:close-circle-bold'} />
                      {password === confirmPassword ? 'Паролдор дал келди' : 'Паролдор дал келген жок'}
                    </div>
                  )}

                  <MButton
                    type="submit"
                    disabled={loading}
                    whileHover={{ scale: loading ? 1 : 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-3.5 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/25 hover:bg-secondary transition-colors disabled:opacity-60 text-sm flex items-center justify-center gap-2"
                  >
                    {loading ? <><Icon icon="svg-spinners:ring-resize" className="text-lg" /> Жиберүүдө...</> : <><Icon icon="solar:letter-bold" className="text-lg" /> Код жиберүү</>}
                  </MButton>
                </form>
              </MD>
            )}

            {step === 2 && (
              <MD key="step2" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-3">
                    <Icon icon="solar:letter-opened-bold-duotone" className="text-3xl text-primary" />
                  </div>
                  <h2 className="text-xl font-black text-midnight_text">Кодду текшерүү</h2>
                  <p className="text-gray-400 text-sm mt-1">
                    <span className="font-semibold text-midnight_text">{email}</span> дарегине 6 орундуу код жиберилди
                  </p>
                </div>

                {error && (
                  <div className="mb-4 flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-2xl">
                    <Icon icon="solar:danger-circle-bold" className="text-red-500 text-lg flex-shrink-0" />
                    <p className="text-red-600 text-xs font-medium">{error}</p>
                  </div>
                )}

                <form onSubmit={handleVerify} className="space-y-5">
                  {/* OTP поля */}
                  <div className="flex gap-2 justify-center">
                    {otp.map((digit, i) => (
                      <input
                        key={i}
                        ref={(el) => { otpRefs.current[i] = el }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        onKeyDown={(e) => handleOtpKey(i, e)}
                        className="w-11 h-13 text-center text-xl font-black rounded-xl border-2 border-slate-200 bg-slate-50 text-midnight_text focus:outline-none focus:border-primary focus:bg-white transition-all"
                        style={{ height: '3.25rem' }}
                      />
                    ))}
                  </div>

                  <MButton
                    type="submit"
                    disabled={loading || otp.join('').length < 6}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-3.5 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/25 hover:bg-secondary transition-colors disabled:opacity-50 text-sm flex items-center justify-center gap-2"
                  >
                    {loading ? <><Icon icon="svg-spinners:ring-resize" className="text-lg" /> Текшерилүүдө...</> : <><Icon icon="solar:shield-check-bold" className="text-lg" /> Ырастоо</>}
                  </MButton>

                  <div className="flex items-center justify-between text-sm">
                    <button type="button" onClick={() => goTo(1)} className="text-gray-400 hover:text-primary transition-colors flex items-center gap-1">
                      <Icon icon="solar:arrow-left-linear" /> Артка
                    </button>
                    <button type="button" onClick={handleResend} disabled={loading} className="text-primary hover:underline font-medium disabled:opacity-50">
                      Кайра жиберүү
                    </button>
                  </div>
                </form>
              </MD>
            )}

            {step === 3 && (
              <MD key="step3" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit">
                <div className="text-center py-6">
                  <MD
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.1 }}
                    className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-5"
                  >
                    <Icon icon="solar:check-circle-bold-duotone" className="text-5xl text-green-500" />
                  </MD>
                  <h2 className="text-2xl font-black text-midnight_text mb-2">Каттоо аяктады!</h2>
                  <p className="text-gray-400 text-sm mb-8">Сиздин аккаунтуңуз ийгиликтүү түзүлдү</p>
                  <MButton
                    onClick={() => window.location.href = '/student'}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className="w-full py-3.5 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/25 hover:bg-secondary transition-colors text-sm flex items-center justify-center gap-2"
                  >
                    <Icon icon="solar:home-bold" className="text-lg" />
                    Профилге өтүү
                  </MButton>
                </div>
              </MD>
            )}
          </AnimatePresence>

          {/* Ссылка на вход */}
          {step < 3 && (
            <p className="text-center text-sm text-gray-400 mt-6">
              Аккаунтуңуз барбы?{' '}
              <Link href="/signin" className="text-primary font-bold hover:underline">
                Кирүү
              </Link>
            </p>
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
