'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Icon } from '@iconify/react'
import { motion, useInView } from 'framer-motion'

/* eslint-disable @typescript-eslint/no-explicit-any */
const MD = motion.div as any

interface OlympiadProps {
  data?: any
}

async function openPDF(url: string) {
  try {
    const res = await fetch(url)
    const blob = await res.blob()
    const pdfBlob = new Blob([blob], { type: 'application/pdf' })
    const blobUrl = URL.createObjectURL(pdfBlob)
    window.open(blobUrl, '_blank')
  } catch {
    window.open(url, '_blank')
  }
}

function TiltCard({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const [hovered, setHovered] = useState(false)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = ((e.clientY - rect.top) / rect.height - 0.5) * 12
    const y = -((e.clientX - rect.left) / rect.width - 0.5) * 12
    setTilt({ x, y })
  }

  return (
    <div
      ref={ref}
      className={className}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setTilt({ x: 0, y: 0 }) }}
      style={{
        transform: hovered
          ? `perspective(800px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(1.02)`
          : 'perspective(800px) rotateX(0deg) rotateY(0deg) scale(1)',
        transition: hovered ? 'transform 0.1s ease-out' : 'transform 0.4s ease-out',
        willChange: 'transform',
      }}
    >
      {children}
    </div>
  )
}

const OlympiadComponent: React.FC<OlympiadProps> = ({ data }) => {
  const [mounted, setMounted] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref as React.RefObject<Element>, { once: true, margin: '-80px' })

  useEffect(() => setMounted(true), [])

  const olympiads = Array.isArray(data) ? data : []
  if (olympiads.length === 0) return null

  return (
    <section id="olympiads" className="scroll-mt-12 py-20 relative overflow-hidden">
      {/* Фоновые пятна */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-purple-500/5 blur-[100px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-blue-500/5 blur-[100px]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">

        {/* Заголовок */}
        <MD
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center max-w-2xl mx-auto mb-16 space-y-3"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/8 text-primary rounded-full text-xs font-black tracking-widest uppercase border border-primary/20">
            {mounted && <Icon icon="solar:cup-bold-duotone" width={16} />}
            Мектептик Олимпиадалар
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-midnight_text tracking-tight">
            Өз билимиңди сынап көр!
          </h2>
          <p className="text-gray-500 text-sm leading-relaxed">
            Төмөндөгү активдүү олимпиадаларга катышып, интеллектуалдык деңгээлиңизди көтөрүңүз жана баалуу сыйлыктарга ээ болуңуз.
          </p>
        </MD>

        {/* Сетка карточек */}
        <div ref={ref} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {olympiads.map((item: any, i: number) => {
            const detailUrl = `/olympiads/${item.ID}`
            const isOnline = item.format === 'Онлайн'

            return (
              <MD
                key={i}
                initial={{ opacity: 0, y: 50 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              >
                <TiltCard className="h-full">
                  <div className="group bg-white shadow-sm hover:shadow-2xl hover:shadow-primary/10 rounded-[2.5rem] overflow-hidden border border-slate-100 transition-all duration-500 flex flex-col h-full relative">

                    {/* Изображение */}
                    <div className="p-3 pb-0">
                      <div className="relative h-52 w-full rounded-[2.1rem] overflow-hidden">
                        <Image
                          src={item.image_url || '/images/courses/placeholder.png'}
                          alt={item.title}
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
                        />

                        {/* Градиент поверх фото */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

                        {/* Формат бейдж */}
                        <div className={`absolute top-4 left-4 backdrop-blur-md px-3.5 py-1.5 rounded-2xl shadow-sm flex items-center gap-1.5 border ${
                          isOnline
                            ? 'bg-purple-500/15 text-purple-700 border-purple-500/25'
                            : 'bg-blue-500/15 text-blue-700 border-blue-500/25'
                        }`}>
                          <span className={`h-2 w-2 rounded-full ${isOnline ? 'bg-purple-500' : 'bg-blue-500'} animate-pulse`} />
                          <p className="text-[10px] font-black uppercase tracking-wider">
                            {item.format}
                          </p>
                        </div>

                        {/* Предмет бейдж */}
                        <div className="absolute bottom-4 right-4 bg-white/15 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/25">
                          <p className="text-white text-[10px] font-black uppercase tracking-wider">
                            {item.subject}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Контент */}
                    <div className="p-6 flex flex-col flex-grow">
                      <div className="mb-5 flex-grow">
                        <h4 className="text-xl font-extrabold text-midnight_text group-hover:text-primary transition-colors duration-300 line-clamp-2 leading-snug">
                          {item.title}
                        </h4>
                        <p className="text-xs text-gray-400 mt-2.5 line-clamp-2 leading-relaxed">
                          {item.description || 'Бул олимпиада боюнча кошумча маалымат берилген эмес.'}
                        </p>
                      </div>

                      {/* Дата и место */}
                      <div className="space-y-3 pt-4 border-t border-slate-50">
                        <div className="flex items-center gap-2.5 text-slate-600">
                          {mounted && <Icon icon="solar:calendar-date-bold-duotone" className="text-primary text-xl flex-shrink-0" />}
                          <span className="text-xs font-bold tracking-tight">{item.date}</span>
                        </div>
                        <div className="flex items-center gap-2.5 text-slate-600 truncate">
                          {mounted && <Icon icon="solar:map-point-bold-duotone" className="text-rose-500 text-xl flex-shrink-0" />}
                          <span className="text-xs font-medium truncate" title={item.location}>
                            {item.location || 'Дареги такталууда'}
                          </span>
                        </div>
                      </div>

                      {/* PDF кнопка */}
                      {item.file_url && (
                        <button
                          onClick={() => openPDF(item.file_url)}
                          className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-500 transition-colors border border-slate-100 cursor-pointer"
                        >
                          {mounted && <Icon icon="solar:document-download-bold-duotone" width={16} className="text-emerald-500" />}
                          Олимпиаданын Жобосу (.pdf)
                        </button>
                      )}

                      {/* Кнопка участия — с shimmer эффектом */}
                      <Link
                        href={detailUrl}
                        className="relative mt-5 w-full py-3.5 bg-primary text-white font-black rounded-2xl text-center shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:bg-secondary transition-all duration-300 block text-sm active:scale-[0.98] overflow-hidden group/btn"
                      >
                        <span className="relative z-10">Катышуу жана Маалымат</span>
                        <span className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12" />
                      </Link>
                    </div>
                  </div>
                </TiltCard>
              </MD>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default OlympiadComponent
