'use client'

import React, { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { createPortal } from 'react-dom'
import { Icon } from '@iconify/react'
import { motion } from 'framer-motion'
import dynamic from 'next/dynamic'
import { fixImageUrl } from '@/utils/apiData'

/* eslint-disable @typescript-eslint/no-explicit-any */
const MD = motion.div as any
const MH1 = motion.h1 as any
const MP = motion.p as any

const FloatingParticles = dynamic(() => import('@/app/components/3d/FloatingParticles'), {
  ssr: false,
})

interface HeroProps {
  bannerData?: {
    photo: string
    title: string
    sub_title: string
    is_active: boolean
  } | null
  courses?: any[]
  contactData?: {
    instagram?: string
    whatsapp?: string
    telegram?: string
  } | null
}

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  }),
}


function getCourseSlug(title: string): string {
  return encodeURIComponent(title.toLowerCase().trim().replace(/\s+/g, '-'))
}

const Hero: React.FC<HeroProps> = ({ bannerData, courses = [], contactData }) => {
  const [mounted, setMounted] = useState(false)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({})
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => setMounted(true), [])

  // Вычисляем позицию dropdown относительно viewport (fixed)
  useEffect(() => {
    if (!open || !inputRef.current) return
    const rect = inputRef.current.getBoundingClientRect()
    setDropdownStyle({
      position: 'fixed',
      top: rect.bottom + 8,
      left: rect.left,
      width: rect.width,
      zIndex: 9999,
    })
  }, [open, query])

  // Закрытие при клике вне
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node
      if (inputRef.current && !inputRef.current.closest('[data-search-box]')?.contains(target)) {
        const dropdown = document.getElementById('search-dropdown')
        if (dropdown && !dropdown.contains(target)) {
          setOpen(false)
        }
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Пересчёт позиции при скролле и ресайзе
  useEffect(() => {
    if (!open) return
    const update = () => {
      if (!inputRef.current) return
      const rect = inputRef.current.getBoundingClientRect()
      setDropdownStyle({
        position: 'fixed',
        top: rect.bottom + 8,
        left: rect.left,
        width: rect.width,
        zIndex: 9999,
      })
    }
    window.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
    }
  }, [open])

  if (!bannerData || !bannerData.is_active) return null

  const filtered = query.trim().length > 0
    ? courses.filter(c =>
        c.title?.toLowerCase().includes(query.toLowerCase()) ||
        c.skills?.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 6)
    : []

  const showDropdown = open && query.trim().length > 0

  const badges = ['Дружное сообщество', 'Индивидуальный путь', 'Школьная атмосфера']

  const dropdown = showDropdown && mounted ? createPortal(
    <div
      id="search-dropdown"
      style={{
        ...dropdownStyle,
        background: 'rgba(255,255,255,0.97)',
        backdropFilter: 'blur(24px) saturate(150%)',
        WebkitBackdropFilter: 'blur(24px) saturate(150%)',
        border: '1px solid rgba(23,165,137,0.2)',
        boxShadow: '0 24px 48px -12px rgba(16,50,60,0.3)',
        borderRadius: '1.25rem',
        overflow: 'hidden',
      }}
    >
      {filtered.length > 0 ? (
        <>
          <p style={{ padding: '12px 16px 4px', fontSize: 10, fontWeight: 900, color: '#17a589', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Найдено: {filtered.length} курс(ов)
          </p>
          {filtered.map((course, i) => (
            <Link
              key={i}
              href={`/courses/${getCourseSlug(course.title)}`}
              onClick={() => { setOpen(false); setQuery('') }}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderTop: i === 0 ? 'none' : '1px solid rgba(0,0,0,0.05)', textDecoration: 'none' }}
              className="hover:bg-primary/5 transition-colors group"
            >
              <div style={{ width: 44, height: 44, borderRadius: 10, overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
                <Image src={fixImageUrl(course.mainImage)} alt={course.title} fill className="object-cover" />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#0c2440', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} className="group-hover:text-primary transition-colors">
                  {course.title}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                  <Icon icon="solar:clock-circle-bold" style={{ color: '#17a589', fontSize: 12, flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: '#9ca3af' }}>{course.duration} мес.</span>
                  {course.skills && <><span style={{ color: '#d1d5db' }}>·</span><span style={{ fontSize: 11, color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{course.skills}</span></>}
                </div>
              </div>
              <Icon icon="solar:arrow-right-linear" style={{ color: '#17a589', flexShrink: 0, opacity: 0.5 }} />
            </Link>
          ))}
        </>
      ) : (
        <div style={{ padding: '20px 16px', textAlign: 'center' }}>
          <Icon icon="solar:sad-circle-bold" style={{ fontSize: 32, color: '#d1d5db', display: 'block', margin: '0 auto 8px' }} />
          <p style={{ fontSize: 13, color: '#9ca3af', fontWeight: 500 }}>Курсы не найдены</p>
        </div>
      )}
    </div>,
    document.body
  ) : null

  return (
    <section
      id="home-section"
      className="relative overflow-hidden py-8 md:py-16 lg:py-24 min-h-[600px]"
    >
      {/* Декоративные акценты */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-20 -left-20 w-[400px] h-[400px] rounded-full bg-primary/8 blur-[100px]" />
        <div className="absolute -bottom-20 -right-20 w-[350px] h-[350px] rounded-full bg-secondary/8 blur-[90px]" />
      </div>

      {/* 3D частицы */}
      {mounted && (
        <div className="absolute inset-0 z-0">
          <FloatingParticles />
        </div>
      )}

      <div className="container relative z-10 mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 lg:gap-8 gap-y-12 items-center">

          {/* Текстовый блок */}
          <div className="col-span-12 lg:col-span-6 flex flex-col gap-6 md:gap-8 order-2 lg:order-1">

            <MD custom={0} variants={fadeUp} initial="hidden" animate="visible" className="flex gap-2 mx-auto lg:mx-0 items-center">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/5 backdrop-blur-sm">
                <Icon icon="solar:verified-check-bold" className="text-primary text-xl" />
                <p className="text-primary text-[10px] md:text-sm font-bold tracking-widest uppercase">
                  Современные методы обучения
                </p>
              </div>
            </MD>

            <MH1
              custom={1}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="text-midnight_text lg:text-start text-center text-3xl md:text-5xl lg:text-6xl font-black leading-[1.1]"
            >
              {bannerData.title?.length > 30
                ? `${bannerData.title.slice(0, 30)}...`
                : bannerData.title}
            </MH1>

            <MP
              custom={2}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="text-black/60 text-base md:text-lg lg:text-start text-center max-w-xl mx-auto lg:mx-0 leading-relaxed line-clamp-3"
            >
              {bannerData.sub_title}
            </MP>

            {/* Поиск */}
            <MD custom={3} variants={fadeUp} initial="hidden" animate="visible" className="relative w-full max-w-md mx-auto lg:mx-0">
              <div data-search-box="true">
                <div className="relative group">
                  <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 scale-105" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={e => { setQuery(e.target.value); setOpen(true) }}
                    onFocus={() => setOpen(true)}
                    placeholder="Поиск курсов..."
                    className="relative py-4 md:py-5 pl-6 md:pl-8 pr-16 md:pr-20 text-base md:text-lg w-full text-midnight_text rounded-full border border-white/70 focus:outline-none focus:border-primary duration-300 transition-all"
                    style={{ background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(18px)' }}
                  />
                  <button
                    onClick={() => inputRef.current?.focus()}
                    className="bg-primary hover:bg-secondary p-3 md:p-4 rounded-full absolute right-1.5 top-1.5 md:right-2 md:top-2 duration-300 text-white shadow-lg cursor-pointer transition-transform hover:scale-110 active:scale-95"
                  >
                    <Icon icon="solar:magnifer-linear" className="text-xl md:text-2xl" />
                  </button>
                </div>
              </div>
            </MD>

            {/* Бейджи */}
            <MD
              custom={4}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="flex items-center justify-center lg:justify-start flex-wrap gap-3 md:gap-4 pt-2"
            >
              {badges.map((item, idx) => (
                <MD
                  key={idx}
                  whileHover={{ scale: 1.05, y: -2 }}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl glass-card cursor-default"
                >
                  <Icon icon="solar:check-circle-bold" className="text-primary text-lg" />
                  <p className="text-[10px] md:text-sm font-bold text-midnight_text uppercase tracking-tight">
                    {item}
                  </p>
                </MD>
              ))}
            </MD>
          </div>

          {/* Блок с фото + соцсети справа */}
          <MD
            initial={{ opacity: 0, scale: 0.85, x: 40 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
            className="col-span-12 lg:col-span-6 flex items-center justify-center gap-4 relative order-1 lg:order-2"
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] h-[90%] rounded-[3rem] bg-primary/10 blur-[60px] pointer-events-none" />

            <MD animate={{ y: [0, -12, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -top-4 right-8 z-20 glass-card rounded-2xl px-3 py-2 flex items-center gap-2"
            >
              <Icon icon="solar:star-bold" className="text-yellow-400 text-lg" />
              <span className="text-xs font-bold text-midnight_text">4.9 рейтинг</span>
            </MD>

            <MD animate={{ y: [0, 10, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
              className="absolute bottom-4 -left-4 z-20 glass-card rounded-2xl px-3 py-2 flex items-center gap-2"
            >
              <Icon icon="solar:users-group-rounded-bold" className="text-primary text-lg" />
              <span className="text-xs font-bold text-midnight_text">1200+ студентов</span>
            </MD>

            <MD animate={{ y: [0, -8, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              className="absolute bottom-12 right-0 z-20 glass-card rounded-2xl px-3 py-2 flex items-center gap-2"
            >
              <Icon icon="solar:book-bold" className="text-secondary text-lg" />
              <span className="text-xs font-bold text-midnight_text">50+ курсов</span>
            </MD>

            <div className="relative w-full max-w-[320px] sm:max-w-[420px] lg:max-w-[500px] z-10">
              <div className="absolute inset-0 rounded-[2.5rem] -rotate-3 scale-95"
                style={{ background: 'linear-gradient(140deg, rgba(23,165,137,0.18), rgba(18,58,94,0.12))', border: '1px solid rgba(23,165,137,0.2)' }}
              />
              <div className="relative rounded-[2.5rem] overflow-hidden"
                style={{
                  background: 'rgba(255,255,255,0.55)',
                  backdropFilter: 'blur(12px) saturate(140%)',
                  WebkitBackdropFilter: 'blur(12px) saturate(140%)',
                  border: '1px solid rgba(255,255,255,0.85)',
                  boxShadow: '0 32px 64px -20px rgba(16,50,60,0.25), inset 0 1px 0 rgba(255,255,255,0.9)',
                  padding: '10px',
                }}
              >
                <div className="absolute bottom-0 left-0 right-0 h-1/3 z-10 pointer-events-none rounded-b-[2rem]"
                  style={{ background: 'linear-gradient(to top, rgba(23,165,137,0.08), transparent)' }}
                />
                <div className="relative aspect-square w-full rounded-[2rem] overflow-hidden">
                  <Image
                    src={fixImageUrl(bannerData.photo)}
                    alt={bannerData.title}
                    fill
                    priority
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
              </div>
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-3/4 h-12 pointer-events-none"
                style={{ background: 'radial-gradient(ellipse, rgba(23,165,137,0.3), transparent 70%)', filter: 'blur(8px)' }}
              />
            </div>

            {/* ── Соцсети + Контакты — только desktop ── */}
            <div className="hidden lg:flex flex-col items-center gap-3 self-center flex-shrink-0">
              {contactData?.instagram && (
                <Link
                  href={contactData.instagram}
                  target="_blank"
                  className="group flex items-center justify-center w-10 h-10 rounded-2xl glass-card hover:-translate-y-1 transition-all duration-300"
                  aria-label="Instagram"
                >
                  <Icon icon="skill-icons:instagram" width={22} className="group-hover:scale-110 transition-transform" />
                </Link>
              )}
              {contactData?.whatsapp && (
                <Link
                  href={`https://wa.me/${(contactData.whatsapp || '').replace(/\D/g, '')}`}
                  target="_blank"
                  className="group flex items-center justify-center w-10 h-10 rounded-2xl glass-card hover:-translate-y-1 transition-all duration-300"
                  aria-label="WhatsApp"
                >
                  <Icon icon="logos:whatsapp-icon" width={22} className="group-hover:scale-110 transition-transform" />
                </Link>
              )}
              {contactData?.telegram && (
                <Link
                  href={contactData.telegram}
                  target="_blank"
                  className="group flex items-center justify-center w-10 h-10 rounded-2xl glass-card hover:-translate-y-1 transition-all duration-300"
                  aria-label="Telegram"
                >
                  <Icon icon="logos:telegram" width={22} className="group-hover:scale-110 transition-transform" />
                </Link>
              )}

              {/* Разделитель */}
              <div className="w-px h-8 rounded-full bg-primary/20" />

              {/* Кнопка Контакты — вертикальный текст */}
              <Link
                href="/#contact"
                className="px-4 py-2.5 rounded-2xl bg-primary text-white text-xs font-black tracking-wide uppercase shadow-lg shadow-primary/30 hover:bg-secondary hover:-translate-y-1 transition-all duration-300 text-center whitespace-nowrap"
              >
                Контакты
              </Link>
            </div>
          </MD>

        </div>
      </div>

      {/* Portal dropdown — рендерится в document.body поверх всего */}
      {dropdown}
    </section>
  )
}

export default Hero
