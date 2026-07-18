'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Icon } from '@iconify/react'
import Logo from './Logo'
import HeaderLink from './Navigation/HeaderLink'
import MobileHeaderLink from './Navigation/MobileHeaderLink'
import Link from 'next/link'
import { HeaderType } from '@/app/types/menu'
import Signin from '../../Auth/SignIn/Signin'
import Cookies from 'js-cookie'
import { useRouter } from 'next/navigation'

interface HeaderProps {
  navData: HeaderType[];
  contactData: any | null;
}

const Header: React.FC<HeaderProps> = ({ navData, contactData }) => {
  const [navbarOpen, setNavbarOpen] = useState(false)
  const [sticky, setSticky] = useState(false)
  const [visibleItems, setVisibleItems] = useState(4)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const mobileMenuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const handleScroll = () => {
    setSticky(window.scrollY >= 80)
  }

  useEffect(() => {
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const whatsappLink = contactData?.whatsapp ? `https://wa.me/${contactData.whatsapp.replace(/\D/g, '')}` : '#'

  const fixedMenus: HeaderType[] = [
    { label: "Рейтинг", href: "/rating" },
    { label: "Олимпиада", href: "/olympiads" },
    { label: "Ресурсы", href: "/resources" },
    { label: "Игры", href: "/games" },
    { label: "Тур по школе", href: "/school-tour" },

    
  ];
  // 2. Бэкендден келген меню менен туруктуу менюларды бириктирүү
  const baseNavData = navData || [];
  const combinedNavData = [...fixedMenus, ...baseNavData];

  // 3. Кесүү (slice) логикасын жаңы жалпы массивге колдонуу
  const visibleNavData = combinedNavData.slice(0, visibleItems)
  const hiddenNavData = combinedNavData.slice(visibleItems)
  const hasMoreItems = hiddenNavData.length > 0

  const showAllItems = () => {
    setVisibleItems(combinedNavData.length)
  }

  const hideExtraItems = () => {
    setVisibleItems(4)
  }

  const [userInitial, setUserInitial] = useState<string | null>(null)

  useEffect(() => {
    const token = Cookies.get('auth_token')
    if (!token) return
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      setUserInitial((payload.email as string)?.[0]?.toUpperCase() || null)
    } catch {
      // ignore
    }
  }, [])

  const handleAccountClick = () => {
    const token = Cookies.get('auth_token')
    if (token) {
      router.push('/student')
    } else {
      setIsLoginModalOpen(true)
    }
  }

  return (
    <>
      <header
        className={`fixed top-0 z-40 w-full transition-all duration-300 glass-nav ${
          sticky ? "py-2" : "py-4"
        }`}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-shrink-0">
              <Logo />
            </div>

            <nav className="hidden lg:flex grow items-center justify-center">
              <div className="flex gap-x-8 items-center">
                {visibleNavData.map((item, index) => (
                  <HeaderLink key={index} item={item} />
                ))}

                {hasMoreItems && (
                  <div className="relative group">
                    <button
                      className="flex items-center gap-1 text-midnight_text hover:text-primary transition-colors font-medium"
                    >
                      <span>Еще</span>
                      <Icon icon="solar:alt-arrow-down-bold" width={16} />
                    </button>

                    <div className="absolute top-full left-0 mt-2 rounded-xl min-w-[200px] py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 glass-card">
                      {hiddenNavData.map((item, index) => (
                        <div key={index} className="px-4 py-2 hover:bg-gray-50">
                          <HeaderLink item={item} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </nav>

            <div className="flex items-center gap-3 md:gap-4 flex-shrink-0">
              <button
                onClick={handleAccountClick}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 hover:bg-primary/20 transition-all hover:scale-105 border border-primary/20"
                aria-label={userInitial ? 'Личный кабинет' : 'Войти'}
              >
                {userInitial ? (
                  <span className="text-primary font-black text-base leading-none">{userInitial}</span>
                ) : (
                  <Icon icon="material-symbols:account-circle-outline" width={26} className="text-primary" />
                )}
              </button>

              <button
                onClick={() => setNavbarOpen(!navbarOpen)}
                className="lg:hidden p-1 text-midnight_text"
              >
                <Icon icon={navbarOpen ? "solar:close-circle-bold" : "solar:hamburger-menu-broken"} width={34} />
              </button>
            </div>
          </div>

        </div>
      </header>

      {/* Overlay — закрывает меню по клику на фон */}
      {navbarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={() => setNavbarOpen(false)}
        />
      )}

      {/* Мобильное меню */}
      <div
        ref={mobileMenuRef}
        className={`lg:hidden fixed top-0 right-0 h-full w-full max-w-[300px] shadow-2xl transform transition-transform duration-500 ease-in-out z-50 ${
          navbarOpen ? "translate-x-0" : "translate-x-full"
        }`}
        style={{
          background: "rgba(242,249,246,0.97)",
          backdropFilter: "blur(20px) saturate(150%)",
          WebkitBackdropFilter: "blur(20px) saturate(150%)",
          borderLeft: "1px solid rgba(23,165,137,0.15)",
        }}
      >
        {/* Шапка меню — только кнопка закрытия */}
        <div className="flex items-center justify-end p-5 border-b border-primary/10">
          <button
            onClick={() => setNavbarOpen(false)}
            className="flex items-center justify-center w-9 h-9 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors"
          >
            <Icon icon="solar:close-bold" width={20} className="text-primary" />
          </button>
        </div>

        <nav className="flex flex-col p-6 space-y-2 overflow-y-auto max-h-[calc(100vh-80px)]">
          {visibleNavData.map((item, index) => (
            <div key={index} onClick={() => setNavbarOpen(false)}>
              <MobileHeaderLink item={item} />
            </div>
          ))}

          {hasMoreItems && (
            <button
              onClick={() => {
                if (visibleItems === combinedNavData.length) {
                  hideExtraItems()
                } else {
                  showAllItems()
                }
              }}
              className="flex items-center justify-center gap-2 text-primary font-medium py-2 px-4 border border-primary/30 rounded-xl hover:bg-primary/10 transition-colors text-sm"
            >
              <span>{visibleItems === combinedNavData.length ? 'Скрыть' : 'Показать еще'}</span>
              <Icon
                icon={visibleItems === combinedNavData.length ? "solar:alt-arrow-up-bold" : "solar:alt-arrow-down-bold"}
                width={16}
              />
            </button>
          )}

          {visibleItems === combinedNavData.length && hiddenNavData.map((item, index) => (
            <div key={`hidden-${index}`} onClick={() => setNavbarOpen(false)}>
              <MobileHeaderLink item={item} />
            </div>
          ))}

          <div className="pt-6 border-t border-primary/10 mt-4 space-y-3">
            <Link
              href="/#contact"
              className="flex items-center justify-center bg-primary text-white w-full py-3.5 rounded-2xl font-bold text-sm shadow-lg shadow-primary/20"
              onClick={() => setNavbarOpen(false)}
            >
              Записаться
            </Link>

            <button
              onClick={() => { handleAccountClick(); setNavbarOpen(false) }}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl border border-primary/20 bg-primary/5 text-primary font-bold text-sm hover:bg-primary/10 transition-colors"
            >
              <Icon icon="material-symbols:account-circle-outline" width={22} />
              Личный кабинет
            </button>

            <div className="pt-2">
              <p className="text-[10px] font-black text-primary/50 uppercase tracking-[2px] mb-3 text-center">Наши соцсети</p>
              <div className="flex justify-center gap-6">
                <Link href={contactData?.instagram || "#"} target="_blank"><Icon icon="skill-icons:instagram" width={30} /></Link>
                <Link href={whatsappLink} target="_blank"><Icon icon="logos:whatsapp-icon" width={30} /></Link>
                <Link href={contactData?.telegram || "#"} target="_blank"><Icon icon="logos:telegram" width={30} /></Link>
              </div>
            </div>
          </div>
        </nav>
      </div>

      {/* Модальное окно логина */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-8 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsLoginModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Icon icon="solar:close-circle-bold" width={32} />
            </button>

            <Signin onClose={() => setIsLoginModalOpen(false)} />
          </div>
        </div>
      )}
    </>
  )
}

export default Header