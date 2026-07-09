'use client'

import React from 'react'
import Link from 'next/link'
import Logo from '../Header/Logo'
import { Icon } from '@iconify/react'

interface FooterProps {
  data?: any; // Сюда придут данные school_info
}

const Footer: React.FC<FooterProps> = ({ data }) => {
  // Если данных нет, можно вернуть пустой блок или дефолтные значения
  const school = data || {};

  return (
    <footer className='pt-16 border-t border-primary/10' style={{ background: 'linear-gradient(180deg, #e4f2ea 0%, #daf0e4 100%)' }}>
      <div className='container mx-auto px-4'>
        <div className='grid grid-cols-1 sm:grid-cols-6 lg:gap-20 md:gap-24 sm:gap-12 gap-12 pb-10'>

          {/* 1. Логотип и Соцсети */}
          <div className='col-span-2'>
            <div className='mb-8'>
              <Logo />
            </div>
            <div className='flex items-center gap-4'>
              {school.instagram && (
                <Link href={school.instagram} target="_blank" className='hover:text-primary text-black text-3xl transition-colors'>
                  <Icon icon='tabler:brand-instagram' />
                </Link>
              )}
              {school.whatsapp && (
                <Link href={`https://wa.me/${school.whatsapp.replace(/\D/g, '')}`} target="_blank" className='hover:text-primary text-black text-3xl transition-colors'>
                  <Icon icon='tabler:brand-whatsapp' />
                </Link>
              )}
              {school.telegram && (
                <Link href={school.telegram} target="_blank" className='hover:text-primary text-black text-3xl transition-colors'>
                  <Icon icon='tabler:brand-telegram' />
                </Link>
              )}
              {school.facebook && (
                <Link href={school.facebook} target="_blank" className='hover:text-primary text-black text-3xl transition-colors'>
                  <Icon icon='tabler:brand-facebook' />
                </Link>
              )}
            </div>
          </div>

          {/* 2. Быстрые ссылки (можно оставить статичными или завязать на меню) */}
          <div className='col-span-2'>
            <p className='text-black text-xl font-bold mb-7 uppercase tracking-wider'>
              Контакты
            </p>
            <ul className='space-y-4'>
              <li>
                <Link href="/about" className='text-black/60 hover:text-primary transition-colors'>О нас</Link>
              </li>
              <li>
                <Link href="/courses" className='text-black/60 hover:text-primary transition-colors'>Курсы</Link>
              </li>
              <li>
                <Link href="/contact" className='text-black/60 hover:text-primary transition-colors'>Контакты</Link>
              </li>
            </ul>
          </div>

          {/* 3. Контактная информация из Базы */}
          <div className='col-span-2'>
            <div className='flex flex-col gap-6'>
              {school.address && (
                <div className='flex items-start gap-3'>
                  <Icon icon='solar:point-on-map-perspective-bold' className='text-primary text-2xl mt-1 flex-shrink-0' />
                  <p className='text-black/80 text-sm leading-relaxed'>
                    {school.address}
                  </p>
                </div>
              )}

              {school.phones && school.phones.split(',').map((phone: string, index: React.Key | null | undefined) => {
                const trimmedPhone = phone.trim(); // Убираем лишние пробелы по краям
                const phoneDigits = trimmedPhone.replace(/\s+/g, ''); // Убираем все пробелы для ссылки tel:

                return (
                  <Link
                    key={index}
                    href={`tel:${phoneDigits}`}
                    className='flex items-center gap-3 group w-fit mb-2 last:mb-0'
                  >
                    <Icon
                      icon='solar:phone-bold'
                      className='text-primary text-2xl flex-shrink-0 transition-transform group-hover:scale-110'
                    />
                    <p className='text-black/60 group-hover:text-primary transition-colors font-medium'>
                      {trimmedPhone}
                    </p>
                  </Link>
                );
              })}

              {school.email && (
                <Link href={`mailto:${school.email}`} className='flex items-center gap-3 group w-fit'>
                  <Icon icon='solar:mailbox-bold' className='text-primary text-2xl flex-shrink-0' />
                  <p className='text-black/60 group-hover:text-primary transition-colors font-medium'>
                    {school.email}
                  </p>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* 4. Нижняя панель */}
        <div className='mt-10 lg:flex items-center justify-between border-t border-black/10 py-8'>
          <p className='text-black/40 text-sm text-center lg:text-start'>
            © {new Date().getFullYear()} Nice School. Все права защищены.
          </p>
          <div className='flex gap-6 mt-4 lg:mt-0 justify-center'>
            <Link href='/privacy' className='text-black/40 hover:text-primary text-sm transition-colors'>
              Политика конфиденциальности
            </Link>
            <Link href='/terms' className='text-black/40 hover:text-primary text-sm transition-colors'>
              Условия использования
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer