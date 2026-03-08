'use client'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import Logo from './Logo'
import HeaderLink from './Navigation/HeaderLink'
import MobileHeaderLink from './Navigation/MobileHeaderLink'
import Signin from '@/app/components/Auth/SignIn'
import SignUp from '@/app/components/Auth/SignUp'
import { Icon } from '@iconify/react/dist/iconify.js'
import { HeaderType } from '@/app/types/menu'

const Header: React.FC = () => {
  const [navbarOpen, setNavbarOpen] = useState(false)
  const [sticky, setSticky] = useState(false)
  const [isSignInOpen, setIsSignInOpen] = useState(false)
  const [isSignUpOpen, setIsSignUpOpen] = useState(false)
  const [navLink, setNavLink] = useState<HeaderType[]>([])

  const signInRef = useRef<HTMLDivElement>(null)
  const signUpRef = useRef<HTMLDivElement>(null)
  const mobileMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/data')
        if (!res.ok) throw new Error('Failed to fetch')
        const data = await res.json()
        setNavLink(data.HeaderData)
      } catch (error) {
        console.error('Error fetching service:', error)
      }
    }
    fetchData()
  }, [])

  const handleScroll = () => {
    setSticky(window.scrollY >= 80)
  }

  const handleClickOutside = (event: MouseEvent) => {
    if (
      signInRef.current &&
      !signInRef.current.contains(event.target as Node)
    ) {
      setIsSignInOpen(false)
    }
    if (
      signUpRef.current &&
      !signUpRef.current.contains(event.target as Node)
    ) {
      setIsSignUpOpen(false)
    }
    if (
      mobileMenuRef.current &&
      !mobileMenuRef.current.contains(event.target as Node) &&
      navbarOpen
    ) {
      setNavbarOpen(false)
    }
  }

  useEffect(() => {
    window.addEventListener('scroll', handleScroll)
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      window.removeEventListener('scroll', handleScroll)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [navbarOpen, isSignInOpen, isSignUpOpen])

  useEffect(() => {
    if (isSignInOpen || isSignUpOpen || navbarOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
  }, [isSignInOpen, isSignUpOpen, navbarOpen])

  return (
    <header
      className={`fixed top-0 z-40 w-full transition-all duration-300 ${
        sticky ? "bg-white shadow-lg py-2" : "bg-transparent shadow-none py-4"
      }`}
    >
      <div className="container mx-auto px-4">
        {/* Добавлена обертка с gap и items-center */}
        <div className="flex items-center justify-between gap-4">
          
          {/* 1. Логотип: shrink-0 гарантирует, что он не сожмется */}
          <div className="flex-shrink-0">
            <Logo />
          </div>

          {/* 2. Навигация: 
              - grow позволяет занимать всё свободное место.
              - min-w-0 важен для flex-контейнеров, чтобы они могли сжиматься.
              - flex-wrap позволяет пунктам переходить на новую строку, если их слишком много.
          */}
          <nav className="hidden lg:flex grow items-center justify-center min-w-0">
            <div className="flex flex-wrap justify-center gap-x-4 xl:gap-x-8 gap-y-2 px-2">
              {navLink.map((item, index) => (
                <HeaderLink key={index} item={item} />
              ))}
            </div>
          </nav>

          {/* 3. Кнопки: shrink-0 чтобы всегда оставались видимыми */}
          <div className="flex items-center gap-2 xl:gap-4 flex-shrink-0">
            <button
              className="hidden lg:block bg-primary text-white hover:bg-primary/15 hover:text-primary py-2 px-4 xl:px-6 rounded-full text-base xl:text-lg font-medium transition-all"
              onClick={() => setIsSignInOpen(true)}
            >
              Sign In
            </button>

            <button
              className="hidden lg:block bg-primary/15 hover:bg-primary text-primary hover:text-white py-2 px-4 xl:px-6 rounded-full text-base xl:text-lg font-medium transition-all"
              onClick={() => setIsSignUpOpen(true)}
            >
              Sign Up
            </button>

            {/* Бургер-меню для мобильных */}
            <button
              onClick={() => setNavbarOpen(!navbarOpen)}
              className="block lg:hidden p-2 rounded-lg"
              aria-label="Toggle mobile menu"
            >
              <div className="space-y-1.5">
                <span className="block w-6 h-0.5 bg-black"></span>
                <span className="block w-6 h-0.5 bg-black"></span>
                <span className="block w-6 h-0.5 bg-black"></span>
              </div>
            </button>
          </div>
        </div>

        {/* --- Модальные окна (Sign In / Sign Up) --- */}
        {isSignInOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div ref={signInRef} className="relative w-full max-w-md bg-white rounded-lg p-8 pt-14 text-center">
              <button onClick={() => setIsSignInOpen(false)} className="absolute top-4 right-4">
                <Icon icon="material-symbols:close-rounded" width={24} className="hover:text-primary" />
              </button>
              <Signin />
            </div>
          </div>
        )}

        {isSignUpOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div ref={signUpRef} className="relative w-full max-w-md bg-white rounded-lg p-8 pt-14 text-center">
              <button onClick={() => setIsSignUpOpen(false)} className="absolute top-4 right-4">
                <Icon icon="material-symbols:close-rounded" width={24} className="hover:text-primary" />
              </button>
              <SignUp />
            </div>
          </div>
        )}

        {/* --- Мобильное меню --- */}
        {navbarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
            onClick={() => setNavbarOpen(false)} 
          />
        )}
        
        <div
          ref={mobileMenuRef}
          className={`lg:hidden fixed top-0 right-0 h-full w-full max-w-xs bg-white shadow-lg transform transition-transform duration-300 z-50 ${
            navbarOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between p-4 border-b">
            <Logo />
            <button onClick={() => setNavbarOpen(false)}>
              <Icon icon="material-symbols:close-rounded" width={24} />
            </button>
          </div>
          
          <nav className="flex flex-col p-4 space-y-2">
            {navLink.map((item, index) => (
              <MobileHeaderLink key={index} item={item} />
            ))}
            <div className="mt-6 flex flex-col gap-4">
              <button
                className="w-full border border-primary text-primary py-2 rounded-lg"
                onClick={() => { setIsSignInOpen(true); setNavbarOpen(false); }}
              >
                Sign In
              </button>
              <button
                className="w-full bg-primary text-white py-2 rounded-lg"
                onClick={() => { setIsSignUpOpen(true); setNavbarOpen(false); }}
              >
                Sign Up
              </button>
            </div>
          </nav>
        </div>
      </div>
    </header>
  )
}

export default Header
