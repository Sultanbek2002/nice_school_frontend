'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { Icon } from '@iconify/react'
import { motion } from 'framer-motion'
import dynamic from 'next/dynamic'

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
}

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  }),
}

const Hero: React.FC<HeroProps> = ({ bannerData }) => {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  if (!bannerData || !bannerData.is_active) return null

  const badges = ['Дружное сообщество', 'Индивидуальный путь', 'Школьная атмосфера']

  return (
    <section
      id="home-section"
      className="relative overflow-hidden bg-slate-gray py-8 md:py-16 lg:py-24 min-h-[600px]"
    >
      {/* Градиентные пятна на фоне */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute -bottom-32 -right-32 w-[400px] h-[400px] rounded-full bg-secondary/10 blur-[100px]" />
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

            <MD
              custom={0}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="flex gap-2 mx-auto lg:mx-0 items-center"
            >
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
            <MD
              custom={3}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="relative w-full max-w-md mx-auto lg:mx-0 group"
            >
              <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 scale-105" />
              <input
                type="text"
                placeholder="Курсту издөө..."
                className="relative py-4 md:py-5 pl-6 md:pl-8 pr-16 md:pr-20 text-base md:text-lg w-full text-black rounded-full border border-primary/20 focus:outline-none focus:border-primary duration-300 shadow-md bg-white/80 backdrop-blur-sm transition-all"
              />
              <button className="bg-primary hover:bg-secondary p-3 md:p-4 rounded-full absolute right-1.5 top-1.5 md:right-2 md:top-2 duration-300 text-white shadow-lg cursor-pointer transition-transform hover:scale-110 active:scale-95">
                <Icon icon="solar:magnifer-linear" className="text-xl md:text-2xl" />
              </button>
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
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/70 backdrop-blur-sm border border-primary/10 shadow-sm cursor-default"
                >
                  <Icon icon="solar:check-circle-bold" className="text-primary text-lg" />
                  <p className="text-[10px] md:text-sm font-bold text-midnight_text uppercase tracking-tight">
                    {item}
                  </p>
                </MD>
              ))}
            </MD>
          </div>

          {/* Блок с фото */}
          <MD
            initial={{ opacity: 0, scale: 0.85, x: 40 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
            className="col-span-12 lg:col-span-6 flex justify-center relative order-1 lg:order-2"
          >
            {/* Кольцо-свечение */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[85%] h-[85%] rounded-full bg-primary/15 blur-[80px] pointer-events-none" />

            {/* Вращающееся кольцо */}
            <MD
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[105%] h-[105%] rounded-full border border-dashed border-primary/20 pointer-events-none"
            />

            {/* Плавающие иконки вокруг фото */}
            <MD
              animate={{ y: [0, -12, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -top-4 right-8 z-20 bg-white rounded-2xl shadow-lg px-3 py-2 flex items-center gap-2 border border-primary/10"
            >
              <Icon icon="solar:star-bold" className="text-yellow-400 text-lg" />
              <span className="text-xs font-bold text-midnight_text">4.9 рейтинг</span>
            </MD>

            <MD
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
              className="absolute bottom-4 -left-4 z-20 bg-white rounded-2xl shadow-lg px-3 py-2 flex items-center gap-2 border border-primary/10"
            >
              <Icon icon="solar:users-group-rounded-bold" className="text-primary text-lg" />
              <span className="text-xs font-bold text-midnight_text">1200+ студентов</span>
            </MD>

            <MD
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              className="absolute bottom-12 right-0 z-20 bg-white rounded-2xl shadow-lg px-3 py-2 flex items-center gap-2 border border-primary/10"
            >
              <Icon icon="solar:book-bold" className="text-secondary text-lg" />
              <span className="text-xs font-bold text-midnight_text">50+ курсов</span>
            </MD>

            {/* Само фото */}
            <div className="relative w-full aspect-square max-w-[320px] sm:max-w-[450px] lg:max-w-[560px] z-10">
              <Image
                src={bannerData.photo || '/images/banner/nice.png'}
                alt={bannerData.title}
                fill
                priority
                className="object-contain drop-shadow-[0_30px_50px_rgba(101,86,255,0.2)]"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          </MD>

        </div>
      </div>
    </section>
  )
}

export default Hero
