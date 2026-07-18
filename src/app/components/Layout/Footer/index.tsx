'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Logo from '../Header/Logo'
import { Icon } from '@iconify/react'

interface FooterProps {
  data?: any
  navLinks?: { label: string; href: string }[]
}

const FIXED_LINKS = [
  { label: 'Рейтинг',      href: '/rating' },
  { label: 'Олимпиада',    href: '/olympiads' },
  { label: 'Ресурсы',      href: '/resources' },
  { label: 'Игры',         href: '/games' },
  { label: 'Тур по школе', href: '/school-tour' },
  { label: 'Управление',   href: '/management' },
]

const SOCIALS = [
  { key: 'instagram', icon: 'tabler:brand-instagram', label: 'Instagram' },
  { key: 'whatsapp',  icon: 'tabler:brand-whatsapp',  label: 'WhatsApp', href: (v: string) => `https://wa.me/${v.replace(/\D/g, '')}` },
  { key: 'telegram',  icon: 'tabler:brand-telegram',  label: 'Telegram' },
  { key: 'facebook',  icon: 'tabler:brand-facebook',  label: 'Facebook' },
]

const Footer: React.FC<FooterProps> = ({ data, navLinks = [] }) => {
  const school = data || {}
  const allNavLinks = [...FIXED_LINKS, ...navLinks]
  const [moreOpen, setMoreOpen] = useState(false)
  const hasExtra = allNavLinks.length > 8
  const col1 = allNavLinks.slice(0, 4)
  const col2 = hasExtra ? allNavLinks.slice(4, 7) : allNavLinks.slice(4, 8)
  const extraLinks = hasExtra ? allNavLinks.slice(7) : []

  return (
    <footer className="border-t border-primary/10" style={{ background: 'linear-gradient(180deg,#e8f5ef 0%,#daf0e4 100%)' }}>
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">

          {/* 1. Лого + описание + соцсети */}
          <div>
            <Logo />
            <p className="text-black/50 text-sm mt-3 mb-4 leading-relaxed max-w-[220px]">
              Современная международная школа с инновационным подходом к обучению.
            </p>
            <div className="flex items-center gap-3">
              {SOCIALS.map(({ key, icon, label, href }) => {
                const val = school[key]
                if (!val) return null
                const link = href ? href(val) : val
                return (
                  <Link key={key} href={link} target="_blank" aria-label={label}
                    className="w-8 h-8 rounded-full bg-primary/10 hover:bg-primary hover:text-white text-primary flex items-center justify-center transition-all">
                    <Icon icon={icon} width={16} />
                  </Link>
                )
              })}
            </div>
          </div>

          {/* 2. Контакты */}
          <div>
            <p className="text-black font-bold text-sm uppercase tracking-wider mb-4">Контакты</p>
            <div className="space-y-3">
              {school.address && (
                <div className="flex items-start gap-2">
                  <Icon icon="solar:point-on-map-perspective-bold" className="text-primary text-lg mt-0.5 flex-shrink-0" />
                  <p className="text-black/55 text-sm leading-relaxed">{school.address}</p>
                </div>
              )}
              {school.phones && school.phones.split(',').map((phone: string, i: number) => {
                const trimmed = phone.trim()
                return (
                  <Link key={i} href={`tel:${trimmed.replace(/\s+/g, '')}`}
                    className="flex items-center gap-2 group w-fit">
                    <Icon icon="solar:phone-bold" className="text-primary text-lg flex-shrink-0" />
                    <span className="text-black/55 group-hover:text-primary transition-colors text-sm">{trimmed}</span>
                  </Link>
                )
              })}
              {school.email && (
                <Link href={`mailto:${school.email}`} className="flex items-center gap-2 group w-fit">
                  <Icon icon="solar:mailbox-bold" className="text-primary text-lg flex-shrink-0" />
                  <span className="text-black/55 group-hover:text-primary transition-colors text-sm">{school.email}</span>
                </Link>
              )}
            </div>
          </div>

          {/* 3. Навигация — 2 колонки по 5, если >10 то "Еще" */}
          <div>
            <p className="text-black font-bold text-sm uppercase tracking-wider mb-4">Меню</p>

            <div className="flex gap-6">
              {/* Колонка 1: первые 5 */}
              <ul className="space-y-2 flex-1">
                {col1.map((item, i) => (
                  <li key={i}>
                    <Link href={item.href} className="text-black/55 hover:text-primary transition-colors text-sm">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>

              {/* Колонка 2: следующие 5 (или 4 + "Еще") */}
              {col2.length > 0 && (
                <ul className="space-y-2 flex-1">
                  {col2.map((item, i) => (
                    <li key={i}>
                      <Link href={item.href} className="text-black/55 hover:text-primary transition-colors text-sm">
                        {item.label}
                      </Link>
                    </li>
                  ))}
                  {extraLinks.length > 0 && (
                    <li>
                      <button
                        onClick={() => setMoreOpen(v => !v)}
                        className="flex items-center gap-1 text-primary text-sm font-medium hover:underline"
                      >
                        <span>{moreOpen ? 'Скрыть' : 'Еще'}</span>
                        <Icon icon={moreOpen ? 'solar:alt-arrow-up-bold' : 'solar:alt-arrow-down-bold'} width={14} />
                      </button>
                    </li>
                  )}
                </ul>
              )}
            </div>

            {/* Раскрытые доп. пункты */}
            {moreOpen && extraLinks.length > 0 && (
              <div className="flex gap-6 mt-2">
                <ul className="space-y-2 flex-1">
                  {extraLinks.slice(0, 5).map((item, i) => (
                    <li key={i}>
                      <Link href={item.href} className="text-black/55 hover:text-primary transition-colors text-sm">
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
                {extraLinks.length > 5 && (
                  <ul className="space-y-2 flex-1">
                    {extraLinks.slice(5, 10).map((item, i) => (
                      <li key={i}>
                        <Link href={item.href} className="text-black/55 hover:text-primary transition-colors text-sm">
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Нижняя панель */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-black/10 mt-6 pt-5">
          <p className="text-black/35 text-xs">
            © {new Date().getFullYear()} NICE International School. Все права защищены.
          </p>
          <div className="flex gap-4">
            <Link href="/privacy" className="text-black/35 hover:text-primary text-xs transition-colors">
              Политика конфиденциальности
            </Link>
            <Link href="/terms" className="text-black/35 hover:text-primary text-xs transition-colors">
              Условия использования
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
