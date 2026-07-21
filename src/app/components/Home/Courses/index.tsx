'use client'

import React, { useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Icon } from '@iconify/react'
import { motion, useInView } from 'framer-motion'
import { fixImageUrl } from '@/utils/apiData'
import Slider from 'react-slick'
import 'slick-carousel/slick/slick.css'
import 'slick-carousel/slick/slick-theme.css'

/* eslint-disable @typescript-eslint/no-explicit-any */
const MD = motion.div as any
const MH2 = motion.h2 as any

interface CoursesProps {
  courses?: any[]
}

function TiltCard({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const [hovered, setHovered] = useState(false)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = ((e.clientY - rect.top) / rect.height - 0.5) * 10
    const y = -((e.clientX - rect.left) / rect.width - 0.5) * 10
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
          ? `perspective(900px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(1.02)`
          : 'perspective(900px) rotateX(0deg) rotateY(0deg) scale(1)',
        transition: hovered ? 'transform 0.1s ease-out' : 'transform 0.4s ease-out',
        willChange: 'transform',
      }}
    >
      {children}
    </div>
  )
}

const Courses: React.FC<CoursesProps> = ({ courses = [] }) => {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref as React.RefObject<Element>, { once: true, margin: '-60px' })

  if (!courses || courses.length === 0) return null

  const settings = {
    dots: true,
    infinite: courses.length > 3,
    slidesToShow: 3,
    slidesToScroll: 1,
    arrows: false,
    autoplay: true,
    autoplaySpeed: 3500,
    speed: 600,
    cssEase: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    responsive: [
      { breakpoint: 1200, settings: { slidesToShow: 2, slidesToScroll: 1 } },
      { breakpoint: 700, settings: { slidesToShow: 1, slidesToScroll: 1 } },
    ],
  }

  return (
    <section id="courses" className="scroll-mt-12 py-20 relative overflow-hidden">
      {/* Фоновые пятна */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-20 right-0 w-80 h-80 rounded-full bg-primary/5 blur-[80px]" />
        <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-secondary/5 blur-[80px]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Заголовок */}
        <div className="flex justify-between items-center mb-12">
          <MH2
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="text-midnight_text capitalize text-3xl md:text-4xl font-bold"
          >
            Популярные курсы
          </MH2>

          <MD
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <Link
              href="/courses"
              className="hidden sm:flex items-center gap-2 text-sm font-bold text-primary hover:text-secondary transition-colors group"
            >
              Бардык курстар
              <Icon icon="solar:arrow-right-bold" className="transition-transform group-hover:translate-x-1" />
            </Link>
          </MD>
        </div>

        {/* Слайдер */}
        <div ref={ref}>
          <Slider {...settings} className="course-slider -mx-3">
            {courses.map((item: any, i: number) => {
              const courseSlug = encodeURIComponent(
                item.title.toLowerCase().trim().replace(/\s+/g, '-')
              )
              const detailUrl = `/courses/${courseSlug}`

              return (
                <MD
                  key={i}
                  initial={{ opacity: 0, y: 40 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: Math.min(i * 0.1, 0.4), ease: [0.22, 1, 0.36, 1] }}
                  className="px-3 h-full"
                >
                  <TiltCard className="h-full">
                    <div className="glass-card group p-3 hover:shadow-2xl hover:shadow-primary/15 rounded-[2rem] h-full transition-all duration-500 flex flex-col hover:-translate-y-1">

                      {/* Изображение */}
                      <div className="relative h-60 w-full rounded-[1.5rem] overflow-hidden">
                        <Image
                          src={fixImageUrl(item.mainImage)}
                          alt={item.title}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        {/* Градиент */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />

                        {/* Бейдж возраста — glassmorphism */}
                        <div className="absolute right-4 top-4 bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl px-3 py-1.5 shadow-lg">
                          <p className="text-white text-xs font-black uppercase tracking-wider">
                            {item.targetAud} жаш +
                          </p>
                        </div>

                        {/* Активный бейдж */}
                        {item.isPublic && (
                          <div className="absolute left-4 top-4 bg-green-500/20 backdrop-blur-md border border-green-400/30 rounded-2xl px-3 py-1.5">
                            <div className="flex items-center gap-1.5">
                              <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                              <p className="text-green-300 text-[10px] font-black uppercase tracking-wider">Активдүү</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Контент */}
                      <div className="px-3 pt-5 flex flex-col flex-grow">
                        <Link href={detailUrl}>
                          <h4 className="text-lg font-bold text-midnight_text hover:text-primary transition-colors duration-300 line-clamp-1">
                            {item.title}
                          </h4>
                        </Link>

                        <p className="text-sm text-black/50 mt-3 line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>

                        {/* Длительность */}
                        <div className="flex justify-between items-center py-4 border-b border-gray-50 mt-4">
                          <div className="flex items-center gap-2">
                            <Icon icon="solar:clock-circle-bold" className="text-primary text-xl" />
                            <p className="text-sm font-bold text-midnight_text uppercase">
                              {item.duration} ай
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Icon icon="solar:star-bold" className="text-yellow-400 text-sm" />
                            <span className="text-xs font-bold text-gray-500">4.8</span>
                          </div>
                        </div>

                        {/* Навыки */}
                        <div className="flex items-center gap-2 pt-4 mb-5">
                          <Icon icon="solar:star-fall-minimalistic-bold" className="text-primary text-lg flex-shrink-0" />
                          <p className="text-[11px] font-bold text-gray-400 uppercase truncate">
                            {item.skills || 'Жалпы билим берүү'}
                          </p>
                        </div>

                        {/* Кнопка с shimmer */}
                        <Link
                          href={detailUrl}
                          className="relative mt-auto w-full py-3.5 bg-primary/5 border border-primary/20 text-primary font-bold rounded-2xl text-center group-hover:bg-primary group-hover:text-white group-hover:border-primary group-hover:shadow-lg group-hover:shadow-primary/20 transition-all duration-400 block text-sm overflow-hidden"
                        >
                          <span className="relative z-10">Толук маалымат</span>
                          <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12" />
                        </Link>
                      </div>
                    </div>
                  </TiltCard>
                </MD>
              )
            })}
          </Slider>
        </div>
      </div>

      <style jsx global>{`
        .course-slider .slick-dots li button:before { color: #17a589; font-size: 10px; }
        .course-slider .slick-dots li.slick-active button:before { color: #17a589; opacity: 1; }
        .course-slider .slick-list { padding-bottom: 24px; overflow: visible; }
        .course-slider .slick-track { display: flex; align-items: stretch; }
        .course-slider .slick-slide > div { height: 100%; }
      `}</style>
    </section>
  )
}

export default Courses
