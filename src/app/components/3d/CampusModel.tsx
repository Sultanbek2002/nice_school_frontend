'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'

// three.js is heavy — load it only once the block scrolls into view.
const CampusModelCanvas = dynamic(() => import('./CampusModelCanvas'), { ssr: false })

export default function CampusModel() {
  const t = useTranslations('SchoolTour')
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVisible(true); io.disconnect() }
    }, { rootMargin: '300px' })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div ref={ref} className="relative w-full h-[52vh] sm:h-[70vh] min-h-[360px] sm:min-h-[420px] max-h-[760px] rounded-3xl overflow-hidden bg-[#dfe9f5] shadow-xl">
      {visible && <CampusModelCanvas onLoaded={() => setLoaded(true)} />}
      {!loaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-slate-500 pointer-events-none">
          <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">{t('model3dLoading')}</span>
        </div>
      )}
      {loaded && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-white/85 backdrop-blur-sm text-slate-600 text-xs font-medium px-3 py-1.5 rounded-full shadow pointer-events-none whitespace-nowrap">
          {t('model3dHint')}
        </div>
      )}
    </div>
  )
}
