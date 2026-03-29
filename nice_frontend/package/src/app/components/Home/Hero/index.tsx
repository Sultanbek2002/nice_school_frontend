'use client'

import React from 'react'
import Image from 'next/image'
import { Icon } from '@iconify/react'

interface HeroProps {
  bannerData?: {
    photo: string;
    title: string;
    sub_title: string;
    is_active: boolean;
  } | null;
}

const Hero: React.FC<HeroProps> = ({ bannerData }) => {
  if (!bannerData || !bannerData.is_active) return null;

  return (
    <section id='home-section' className='bg-slate-gray py-8 md:py-16 lg:py-20 overflow-hidden'>
      <div className='container mx-auto px-4'>
        {/* Добавлен gap-y для мобилок и items-center для выравнивания */}
        <div className='grid grid-cols-1 lg:grid-cols-12 lg:gap-8 gap-y-12 items-center'>

          {/* ТЕКСТОВЫЙ БЛОК: order-2 на мобилках, чтобы текст был ПОД фото */}
          <div className='col-span-12 lg:col-span-6 flex flex-col gap-6 md:gap-8 order-2 lg:order-1'>
            <div className='flex gap-2 mx-auto lg:mx-0 items-center'>
              <Icon
                icon='solar:verified-check-bold'
                className='text-success text-xl md:text-2xl'
              />
              <p className='text-success text-[10px] md:text-sm font-bold tracking-widest uppercase'>
                Современные методы обучения
              </p>
            </div>

            {/* Адаптивный размер текста: text-3xl для мобилок, 6xl для десктопа */}
            <h1 className='text-midnight_text lg:text-start text-center text-3xl md:text-5xl lg:text-6xl font-black leading-[1.1]'>
              {bannerData.title?.length > 30
                ? `${bannerData.title.slice(0, 30)}...`
                : bannerData.title}
            </h1>

            {/* Подзаголовок: Ограничение в 3 строки через CSS (самый надежный метод) */}
            <p className='text-black/70 text-base md:text-lg lg:text-start text-center max-w-xl mx-auto lg:mx-0 leading-relaxed line-clamp-3'>
              {bannerData.sub_title}
            </p>

            {/* Адаптивный поиск: убран фиксированный max-w на мобилках */}
            <div className='relative w-full max-w-md mx-auto lg:mx-0 group'>
              <input
                type='text'
                placeholder='Курсту издөө...'
                className='py-4 md:py-5 pl-6 md:pl-8 pr-16 md:pr-20 text-base md:text-lg w-full text-black rounded-full border border-gray-200 focus:outline-none focus:border-primary duration-300 shadow-sm transition-all'
              />
              <button className='bg-secondary hover:bg-primary p-3 md:p-4 rounded-full absolute right-1.5 top-1.5 md:right-2 md:top-2 duration-300 text-white shadow-lg cursor-pointer'>
                <Icon icon='solar:magnifer-linear' className='text-xl md:text-2xl' />
              </button>
            </div>

            <div className='flex items-center justify-center lg:justify-between pt-4 flex-wrap gap-4 md:gap-6'>
              {['Дружное сообщество', 'Индивидуальный путь', 'Школьная атмосфера'].map((item, idx) => (
                <div key={idx} className='flex items-center gap-2'>
                  <Icon icon="solar:check-circle-bold" className="text-primary text-lg md:text-xl" />
                  <p className='text-[10px] md:text-sm font-bold text-midnight_text uppercase tracking-tight'>
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* БЛОК С ФОТО: order-1 на мобилках (фото сверху) */}
          <div className='col-span-12 lg:col-span-6 flex justify-center relative order-1 lg:order-2'>

            {/* Эффект свечения ("Красим" фон под фото) */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-primary/20 rounded-full blur-[80px] md:blur-[120px] pointer-events-none"></div>

            <div className="relative w-full aspect-square max-w-[320px] sm:max-w-[450px] lg:max-w-[600px] z-10">
              <Image
                src={bannerData.photo || '/images/banner/nice.png'}
                alt={bannerData.title}
                fill
                priority
                /* Эффект тени для PNG, чтобы фото "ожило" */
                className='object-contain drop-shadow-[0_20px_30px_rgba(0,0,0,0.1)]'
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}

export default Hero