'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Icon } from '@iconify/react'
import Logo from './Logo'
import HeaderLink from './Navigation/HeaderLink'
import MobileHeaderLink from './Navigation/MobileHeaderLink'
import Link from 'next/link'
import { HeaderType } from '@/app/types/menu'
import Signin from '../../Auth/SignIn/page'
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
    {
      label: "Рейтинг", 
      href: "/rating", 
    },
    {
      label: "Оюндар", 
      href: "/games", 
    }
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
        className={`fixed top-0 z-40 w-full transition-all duration-300 ${
          sticky ? "bg-white shadow-md py-2" : "bg-transparent py-5"
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

                    <div className="absolute top-full left-0 mt-2 bg-white shadow-lg rounded-lg min-w-[200px] py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
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

            <div className="flex items-center gap-3 md:gap-6 flex-shrink-0">
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

              <div className="flex items-center gap-2">
                <Link
                  href="/#contact"
                  className="hidden sm:block bg-primary text-white px-5 py-2.5 rounded-full text-sm font-bold shadow-lg shadow-primary/20 hover:bg-secondary transition-all active:scale-95 text-center"
                >
                  Жазылуу
                </Link>

                <button
                  onClick={handleAccountClick}
                  className="hidden sm:flex items-center justify-center w-10 h-10 rounded-full bg-blue-50 hover:bg-blue-100 transition-all hover:scale-105 border border-blue-200/50"
                  aria-label="Войти"
                >
                  <Icon icon="material-symbols:account-circle-outline" width={26} className="text-blue-500" />
                </button>
                
                <button
                  onClick={handleAccountClick}
                  className="sm:hidden flex items-center justify-center w-10 h-10 rounded-full bg-blue-50 hover:bg-blue-100 transition-all hover:scale-105 border border-blue-200/50"
                  aria-label="Войти"
                >
                  <Icon icon="material-symbols:account-circle-outline" width={24} className="text-blue-500" />
                </button>
              </div>

              <button
                onClick={() => setNavbarOpen(!navbarOpen)}
                className="lg:hidden p-1 text-midnight_text"
              >
                <Icon icon={navbarOpen ? "solar:close-circle-bold" : "solar:hamburger-menu-broken"} width={34} />
              </button>
            </div>
          </div>

          {/* Мобильное меню */}
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

            <nav className="flex flex-col p-6 space-y-5 overflow-y-auto max-h-[calc(100vh-200px)]">
              {visibleNavData.map((item, index) => (
                <MobileHeaderLink key={index} item={item} />
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
                  className="flex items-center justify-center gap-2 text-primary font-medium py-2 px-4 border border-primary rounded-lg hover:bg-primary hover:text-white transition-colors"
                >
                  <span>{visibleItems === combinedNavData.length ? 'Скрыть' : 'Показать еще'}</span>
                  <Icon
                    icon={visibleItems === combinedNavData.length ? "solar:alt-arrow-up-bold" : "solar:alt-arrow-down-bold"}
                    width={18}
                  />
                </button>
              )}

              {visibleItems === combinedNavData.length && hiddenNavData.map((item, index) => (
                <MobileHeaderLink key={`hidden-${index}`} item={item} />
              ))}

              <div className="pt-8 border-t mt-4 space-y-4">
                <Link
                  href="/#contact"
                  className="flex items-center justify-center bg-primary text-white w-full py-4 rounded-2xl font-bold"
                  onClick={() => setNavbarOpen(false)}
                >
                  Жазылуу
                </Link>

                <div className="flex justify-center pt-2">
                  <button
                    onClick={() => {
                      handleAccountClick()
                      setNavbarOpen(false)
                    }}
                    className="flex items-center justify-center w-14 h-14 rounded-full bg-blue-50 hover:bg-blue-100 transition-all hover:scale-105 border border-blue-200/50"
                    aria-label="Войти"
                  >
                    <Icon icon="material-symbols:account-circle-outline" width={32} className="text-blue-500" />
                  </button>
                </div>

                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] mb-6 text-center mt-4">Биздин соцтармактар</p>
                <div className="flex justify-center gap-8">
                  <Link href={contactData?.instagram || "#"} target="_blank"><Icon icon="skill-icons:instagram" width={35} /></Link>
                  <Link href={whatsappLink} target="_blank"><Icon icon="logos:whatsapp-icon" width={35} /></Link>
                  <Link href={contactData?.telegram || "#"} target="_blank"><Icon icon="logos:telegram" width={35} /></Link>
                </div>
              </div>
            </nav>
          </div>
        </div>
      </header>

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