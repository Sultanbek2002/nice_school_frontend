'use client'
import React, { useEffect, useRef, useState } from 'react'
import { Icon } from '@iconify/react'
import Logo from './Logo'
import HeaderLink from './Navigation/HeaderLink'
import MobileHeaderLink from './Navigation/MobileHeaderLink'
import Link from 'next/link'
import { HeaderType } from '@/app/types/menu'



interface HeaderProps {
  navData: HeaderType[];
  contactData: any | null;
}

const Header: React.FC<HeaderProps> = ({ navData, contactData }) => {
  const [navbarOpen, setNavbarOpen] = useState(false)
  const [sticky, setSticky] = useState(false)
  const mobileMenuRef = useRef<HTMLDivElement>(null)

  const handleScroll = () => {
    setSticky(window.scrollY >= 80)
  }

  useEffect(() => {
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Форматирование номера для WhatsApp
  const whatsappLink = contactData?.whatsapp ? `https://wa.me/${contactData.whatsapp.replace(/\D/g, '')}` : '#'

  return (
    <header
      className={`fixed top-0 z-40 w-full transition-all duration-300 ${
        sticky ? "bg-white shadow-md py-2" : "bg-transparent py-5"
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between gap-4">
          
          {/* 1. Логотип */}
          <div className="flex-shrink-0">
            <Logo />
          </div>

          {/* 2. Навигация */}
          <nav className="hidden lg:flex grow items-center justify-center">
            <div className="flex gap-x-8">
              {navData?.map((item, index) => (
                <HeaderLink key={index} item={item} />
              ))}
            </div>
          </nav>

          {/* 3. Блок Соцсетей и Кнопка */}
          <div className="flex items-center gap-3 md:gap-6 flex-shrink-0">
            
            {/* Иконки для десктопа */}
            <div className="hidden md:flex items-center gap-4 border-r border-gray-200 pr-4">
              {contactData?.instagram && (
                <Link href={contactData.instagram} target="_blank" className="text-midnight_text hover:text-primary transition-all hover:-translate-y-1">
                  <Icon icon="skill-icons:instagram" width={28} />
                </Link>
              )}
              {contactData?.whatsapp && (
                <Link href={whatsappLink} target="_blank" className="text-midnight_text hover:text-primary transition-all hover:-translate-y-1">
                  <Icon icon="logos:whatsapp-icon" width={28} />
                </Link>
              )}
              {contactData?.telegram && (
                <Link href={contactData.telegram} target="_blank" className="text-midnight_text hover:text-primary transition-all hover:-translate-y-1">
                  <Icon icon="logos:telegram" width={28} />
                </Link>
              )}
            </div>

            {/* Кнопка действия (CTA) */}
            <Link 
              href="/enroll" 
              className="hidden sm:block bg-primary text-white px-5 py-2.5 rounded-full text-sm font-bold shadow-lg shadow-primary/20 hover:bg-secondary transition-all active:scale-95"
            >
              Жазылуу
            </Link>

            {/* Бургер меню */}
            <button
              onClick={() => setNavbarOpen(!navbarOpen)}
              className="lg:hidden p-1 text-midnight_text"
            >
              <Icon icon={navbarOpen ? "solar:close-circle-bold" : "solar:hamburger-menu-broken"} width={34} />
            </button>
          </div>
        </div>

        {/* --- Мобильное меню --- */}
        <div
          ref={mobileMenuRef}
          className={`lg:hidden fixed top-0 right-0 h-full w-full max-w-[300px] bg-white shadow-2xl transform transition-transform duration-500 ease-in-out z-50 ${
            navbarOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between p-6 border-b">
            <Logo />
            <button onClick={() => setNavbarOpen(false)} className="text-gray-400">
              <Icon icon="solar:close-square-broken" width={32} />
            </button>
          </div>
          
          <nav className="flex flex-col p-6 space-y-5">
            {navData?.map((item, index) => (
              <MobileHeaderLink key={index} item={item} />
            ))}
            
            <div className="pt-8 border-t mt-4">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] mb-6 text-center">Биздин соцтармактар</p>
              <div className="flex justify-center gap-8">
                <Link href={contactData?.instagram || "#"} target="_blank"><Icon icon="skill-icons:instagram" width={35} /></Link>
                <Link href={whatsappLink} target="_blank"><Icon icon="logos:whatsapp-icon" width={35} /></Link>
                <Link href={contactData?.telegram || "#"} target="_blank"><Icon icon="logos:telegram" width={35} /></Link>
              </div>
              
              <Link 
                href="/enroll" 
                className="mt-10 flex items-center justify-center bg-primary text-white w-full py-4 rounded-2xl font-bold"
                onClick={() => setNavbarOpen(false)}
              >
                Курска жазылуу
              </Link>
            </div>
          </nav>
        </div>
      </div>
    </header>
  )
}

export default Header;