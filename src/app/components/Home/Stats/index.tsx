'use client'

import { useRef, useEffect, useState } from 'react'
import { Icon } from '@iconify/react'
import { motion, useInView } from 'framer-motion'

const MD = motion.div as any

function useCounter(target: number, isInView: boolean, duration = 2000) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!isInView) return
    let start = 0
    const step = target / (duration / 16)
    const timer = setInterval(() => {
      start += step
      if (start >= target) {
        setCount(target)
        clearInterval(timer)
      } else {
        setCount(Math.floor(start))
      }
    }, 16)
    return () => clearInterval(timer)
  }, [isInView, target, duration])

  return count
}

const stats = [
  { icon: 'solar:users-group-rounded-bold', value: 1200, suffix: '+', label: 'Студентов', color: 'text-primary', bg: 'bg-primary/10' },
  { icon: 'solar:book-bold', value: 50, suffix: '+', label: 'Курсов', color: 'text-secondary', bg: 'bg-secondary/10' },
  { icon: 'solar:diploma-bold', value: 15, suffix: '+', label: 'Учителей', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { icon: 'solar:star-bold', value: 98, suffix: '%', label: 'Довольны обучением', color: 'text-amber-500', bg: 'bg-amber-50' },
]

function StatCard({ icon, value, suffix, label, color, bg, index, isInView }: {
  icon: string; value: number; suffix: string; label: string
  color: string; bg: string; index: number; isInView: boolean
}) {
  const count = useCounter(value, isInView)

  return (
    <MD
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.12, ease: [0.22, 1, 0.36, 1] }}
      className="relative group"
    >
      <div className="glass-card rounded-3xl p-8 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl text-center relative overflow-hidden">
        {/* Иконка */}
        <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl ${bg} mb-5 group-hover:scale-110 transition-transform duration-300`}>
          <Icon icon={icon} className={`text-3xl ${color}`} />
        </div>

        {/* Число */}
        <div className="flex items-end justify-center gap-1 mb-2">
          <span className={`text-5xl font-black ${color} tabular-nums`}>
            {count.toLocaleString()}
          </span>
          <span className={`text-3xl font-black ${color} mb-1`}>{suffix}</span>
        </div>

        {/* Подпись */}
        <p className="text-gray-500 font-semibold text-sm uppercase tracking-widest">{label}</p>

        {/* Декоративная линия снизу */}
        <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-1 w-0 group-hover:w-1/2 ${color.replace('text-', 'bg-')} rounded-full transition-all duration-500`} />
      </div>
    </MD>
  )
}

export default function Stats() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref as React.RefObject<Element>, { once: true, margin: '-80px' })

  return (
    <section className="py-20 relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-primary/8 blur-[100px]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Заголовок */}
        <MD
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/8 text-primary rounded-full text-xs font-black tracking-widest uppercase border border-primary/20 mb-4">
            <Icon icon="solar:chart-bold" width={14} />
            Наши достижения
          </div>
          <h2 className="text-midnight_text text-3xl md:text-4xl font-black">
            В цифрах
          </h2>
        </MD>

        {/* Карточки */}
        <div ref={ref} className="grid grid-cols-2 lg:grid-cols-4 gap-5 md:gap-8">
          {stats.map((stat, i) => (
            <StatCard key={i} {...stat} index={i} isInView={isInView} />
          ))}
        </div>
      </div>
    </section>
  )
}
