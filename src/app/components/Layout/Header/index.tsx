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
import { useNotifications } from '@/hooks/useNotifications'

interface HeaderProps {
  navData: HeaderType[];
  contactData: any | null;
}

const Header: React.FC<HeaderProps> = ({ navData, contactData }) => {
  const [navbarOpen, setNavbarOpen] = useState(false)
  const [sticky, setSticky] = useState(false)
  const [splitAt, setSplitAt] = useState(99)
  const [moreOpen, setMoreOpen] = useState(false)
  const moreCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const openMore = () => {
    if (moreCloseTimer.current) clearTimeout(moreCloseTimer.current)
    setMoreOpen(true)
  }
  const closeMore = () => {
    moreCloseTimer.current = setTimeout(() => setMoreOpen(false), 200)
  }
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const mobileMenuRef = useRef<HTMLDivElement>(null)
  const navWrapperRef = useRef<HTMLDivElement>(null)
  const measureRef = useRef<HTMLDivElement>(null)
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
    { label: "О школе", href: "/about", submenu: [{ label: "О нас", href: "/about" }] },
    { label: "Рейтинг", href: "/rating" },
    { label: "Олимпиада", href: "/olympiads" },
    { label: "Ресурсы", href: "/resources" },
    { label: "Игры", href: "/games" },
    { label: "Live Test", href: "/test" },
    { label: "Тур по школе", href: "/school-tour" },
    { label: "Управление", href: "/management" },

    
  ];
  // 2. Бэкендден келген меню менен туруктуу менюларды бириктирүү
  const baseNavData = navData || [];
  const combinedNavData = [...fixedMenus, ...baseNavData];

  const visibleNavData = combinedNavData.slice(0, splitAt)
  const hiddenNavData = combinedNavData.slice(splitAt)
  const hasMoreItems = hiddenNavData.length > 0

  const [userInitial, setUserInitial] = useState<string | null>(null)
  const [notifOpen, setNotifOpen] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications()

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

  useEffect(() => {
    const wrapper = navWrapperRef.current
    const measure = measureRef.current
    if (!wrapper || !measure) return

    const calc = () => {
      const available = wrapper.offsetWidth
      const MORE_BTN = 80
      const GAP = 32
      const items = Array.from(measure.children) as HTMLElement[]
      let total = 0
      let count = 0
      for (let i = 0; i < items.length; i++) {
        const w = items[i].offsetWidth + GAP
        const hasMore = i < items.length - 1
        if (total + w + (hasMore ? MORE_BTN : 0) > available) break
        total += w
        count++
      }
      setSplitAt(count || 1)
    }

    const ro = new ResizeObserver(calc)
    ro.observe(wrapper)
    requestAnimationFrame(calc)
    return () => ro.disconnect()
  }, [combinedNavData.length])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleAccountClick = () => {
    const token = Cookies.get('auth_token')
    if (token) {
      if (notifications.length === 0) {
        router.push('/student')
      } else {
        setNotifOpen(v => !v)
      }
    } else {
      setIsLoginModalOpen(true)
    }
  }

  const notifIcon: Record<string, string> = {
    application_approved: 'solar:check-circle-bold-duotone',
    application_rejected: 'solar:close-circle-bold-duotone',
    result_published:     'solar:cup-star-bold-duotone',
  }
  const notifColor: Record<string, string> = {
    application_approved: 'text-emerald-500',
    application_rejected: 'text-red-400',
    result_published:     'text-amber-500',
  }

  function timeAgo(iso: string) {
    const diff = (Date.now() - new Date(iso).getTime()) / 1000
    if (diff < 60) return 'Азыр'
    if (diff < 3600) return `${Math.floor(diff / 60)} мин.`
    if (diff < 86400) return `${Math.floor(diff / 3600)} саат`
    return `${Math.floor(diff / 86400)} күн`
  }

  return (
    <>
      <header
        className={`fixed top-0 z-40 w-full transition-all duration-300 glass-nav ${
          sticky ? "py-2" : "py-4"
        }`}
      >
        <div className="w-full px-4 pr-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Logo />
            </div>

            {/* Скрытый слой для измерения ширины пунктов */}
            <div
              ref={measureRef}
              className="absolute invisible pointer-events-none flex gap-x-8"
              style={{ whiteSpace: 'nowrap', top: -9999, left: 0 }}
              aria-hidden
            >
              {combinedNavData.map((item, i) => (
                <div key={i}><HeaderLink item={item} /></div>
              ))}
            </div>

            <nav ref={navWrapperRef} className="hidden lg:block flex-1">
              <div className="flex gap-x-8 items-center justify-center">
                {visibleNavData.map((item, index) => (
                  <HeaderLink key={index} item={item} />
                ))}

                {hasMoreItems && (
                  <div
                    className="relative"
                    onMouseEnter={openMore}
                    onMouseLeave={closeMore}
                  >
                    <button className="flex items-center gap-1 text-midnight_text hover:text-primary transition-colors font-medium">
                      <span>Еще</span>
                      <Icon icon="solar:alt-arrow-down-bold" width={16} />
                    </button>
                    {moreOpen && (
                      <div
                        className="absolute top-full left-1/2 -translate-x-1/2 mt-1 rounded-xl min-w-[200px] py-2 glass-card z-50 shadow-lg"
                        onMouseEnter={openMore}
                        onMouseLeave={closeMore}
                      >
                        {hiddenNavData.map((item, index) => (
                          <div key={index} className="px-4 py-2 hover:bg-primary/5 rounded-lg mx-1">
                            <HeaderLink item={item} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </nav>

            <div className="flex items-center gap-3 flex-shrink-0 ml-auto">
              <button
                onClick={() => setNavbarOpen(!navbarOpen)}
                className="lg:hidden p-1 text-midnight_text"
              >
                <Icon icon={navbarOpen ? "solar:close-circle-bold" : "solar:hamburger-menu-broken"} width={34} />
              </button>

              <div className="relative" ref={notifRef}>
                <button
                  onClick={handleAccountClick}
                  className="relative flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 hover:bg-primary/20 transition-all hover:scale-105 border border-primary/20"
                  aria-label={userInitial ? 'Уведомления' : 'Войти'}
                >
                  {userInitial ? (
                    <span className="text-primary font-black text-base leading-none">{userInitial}</span>
                  ) : (
                    <Icon icon="material-symbols:account-circle-outline" width={26} className="text-primary" />
                  )}
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center leading-none shadow-md">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notification dropdown */}
                {notifOpen && userInitial && (
                  <div className="absolute right-0 top-12 w-80 rounded-2xl shadow-2xl z-50 overflow-hidden border border-gray-200" style={{background:'rgba(255,255,255,0.97)',backdropFilter:'blur(20px)'}}>
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-black/5">
                      <span className="font-black text-sm text-midnight_text">Уведомления</span>
                      <div className="flex items-center gap-2">
                        {unreadCount > 0 && (
                          <button onClick={markAllRead} className="text-[11px] font-bold text-primary hover:underline">
                            Баарын окуу
                          </button>
                        )}
                        <button
                          onClick={() => { setNotifOpen(false); router.push('/student') }}
                          className="text-[12px] font-black text-primary hover:underline transition-colors"
                        >
                          Кабинет →
                        </button>
                      </div>
                    </div>

                    {/* List */}
                    <div className="max-h-80 overflow-y-auto divide-y divide-black/5">
                      {notifications.length === 0 ? (
                        <div className="py-10 text-center">
                          <Icon icon="solar:bell-off-bold-duotone" width={32} className="text-gray-300 mx-auto mb-2" />
                          <p className="text-xs text-gray-400 font-semibold">Уведомлений нет</p>
                        </div>
                      ) : notifications.map(n => (
                        <button
                          key={n.ID}
                          onClick={() => {
                            markRead(n.ID)
                            setNotifOpen(false)
                            if (n.link) router.push(n.link)
                          }}
                          className={`w-full text-left flex items-start gap-3 px-4 py-3 transition-colors hover:bg-primary/5 ${!n.is_read ? 'bg-primary/[0.04]' : ''}`}
                        >
                          <div className={`flex-shrink-0 mt-0.5 ${notifColor[n.type] ?? 'text-primary'}`}>
                            <Icon icon={notifIcon[n.type] ?? 'solar:bell-bold-duotone'} width={20} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-xs font-black text-gray-900 leading-snug">
                                {n.title}
                              </p>
                              {!n.is_read && (
                                <span className="flex-shrink-0 w-2 h-2 rounded-full bg-red-500 mt-0.5" />
                              )}
                            </div>
                            <p className="text-[11px] text-gray-600 font-semibold leading-snug mt-0.5 line-clamp-2">{n.body}</p>
                            <p className="text-[10px] text-gray-400 font-medium mt-1">{timeAgo(n.CreatedAt)}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
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
          {combinedNavData.map((item, index) => (
            <div key={index} onClick={() => setNavbarOpen(false)}>
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