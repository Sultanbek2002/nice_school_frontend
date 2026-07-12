'use client'

import { useEffect, useState, useRef } from 'react'
import { Icon } from '@iconify/react'
import { motion, AnimatePresence } from 'framer-motion'
import { GO_API_URL } from '@/utils/apiData';

const MD = motion.div as any
const MS = motion.span as any

interface Student {
  ID: number
  fio: string
  class: string
  score: number
}


// ── 3D Podium: rotating carousel of top-3 ──────────────────────────────────
const MEDALS = [
  { place: 1, color: '#FFD700', glow: '#FFD70066', label: '🥇', crown: true },
  { place: 2, color: '#C0C0C0', glow: '#C0C0C066', label: '🥈', crown: false },
  { place: 3, color: '#CD7F32', glow: '#CD7F3266', label: '🥉', crown: false },
]

function Podium3D({ top3 }: { top3: Student[] }) {
  const [active, setActive] = useState(0) // 0 = first place front
  const [rotating, setRotating] = useState(true)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!rotating) return
    intervalRef.current = setInterval(() => {
      setActive(prev => (prev + 1) % 3)
    }, 2500)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [rotating])

  const getStyle = (idx: number) => {
    const diff = (idx - active + 3) % 3
    if (diff === 0) return { rotateY: 0, z: 200, scale: 1.12, opacity: 1, zIndex: 10 }
    if (diff === 1) return { rotateY: 60, z: -60, scale: 0.82, opacity: 0.7, zIndex: 5 }
    return { rotateY: -60, z: -60, scale: 0.82, opacity: 0.7, zIndex: 5 }
  }

  const positions = [1, 2, 0] // display order: 2nd, 3rd(hidden), 1st

  return (
    <div className="relative flex items-center justify-center" style={{ perspective: '900px', height: 340 }}>
      {/* Carousel */}
      <div className="relative w-full max-w-sm mx-auto" style={{ transformStyle: 'preserve-3d', height: 300 }}>
        {top3.map((student, idx) => {
          const s = getStyle(idx)
          const medal = MEDALS[idx]
          return (
            <div
              key={student.ID}
              onClick={() => { setActive(idx); setRotating(false) }}
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: `translateX(-50%) translateY(-50%) translateZ(${s.z}px) rotateY(${s.rotateY}deg) scale(${s.scale})`,
                opacity: s.opacity,
                zIndex: s.zIndex,
                transition: 'all 0.7s cubic-bezier(0.34,1.56,0.64,1)',
                cursor: 'pointer',
                width: 220,
              }}
            >
              <div
                className="rounded-3xl p-6 text-center select-none"
                style={{
                  background: `linear-gradient(145deg, ${medal.color}22, ${medal.color}44)`,
                  border: `2px solid ${medal.color}`,
                  boxShadow: s.rotateY === 0 ? `0 0 40px ${medal.glow}, 0 20px 60px rgba(0,0,0,0.2)` : 'none',
                  backdropFilter: 'blur(12px)',
                }}
              >
                {medal.crown && (
                  <div className="text-3xl mb-1 animate-bounce">👑</div>
                )}
                <div className="text-5xl mb-3">{medal.label}</div>
                <div className="text-2xl font-black" style={{ color: medal.color }}>
                  #{medal.place}
                </div>
                <div className="text-white font-bold text-base mt-2 leading-tight">{student.fio}</div>
                <div className="text-white/60 text-sm mt-1">{student.class}-й класс</div>
                <div
                  className="mt-4 text-3xl font-black"
                  style={{ color: medal.color, textShadow: `0 0 20px ${medal.color}` }}
                >
                  {student.score}
                  <span className="text-sm font-medium ml-1 opacity-60">балл(ов)</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Dots */}
      <div className="absolute bottom-0 flex gap-2 justify-center">
        {top3.map((_, i) => (
          <button
            key={i}
            onClick={() => { setActive(i); setRotating(false) }}
            className="w-2.5 h-2.5 rounded-full transition-all"
            style={{ background: active === i ? MEDALS[i].color : 'rgba(255,255,255,0.3)' }}
          />
        ))}
      </div>
    </div>
  )
}

// ── Bar Chart ────────────────────────────────────────────────────────────────
function BarChart({ students }: { students: Student[] }) {
  const max = Math.max(...students.map(s => s.score), 1)
  const colors = ['#FFD700', '#C0C0C0', '#CD7F32']

  return (
    <div className="space-y-3 py-2">
      {students.slice(0, 15).map((s, i) => (
        <MD
          key={s.ID}
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.04 }}
          className="flex items-center gap-3"
        >
          <span className="w-6 text-right text-xs font-black" style={{ color: colors[i] || '#6556ff' }}>
            {i + 1}
          </span>
          <span className="w-40 text-sm font-semibold text-white truncate">{s.fio}</span>
          <div className="flex-1 relative h-8 rounded-lg overflow-hidden bg-white/5">
            <MD
              initial={{ width: 0 }}
              animate={{ width: `${(s.score / max) * 100}%` }}
              transition={{ duration: 0.8, delay: i * 0.04, ease: 'easeOut' }}
              className="absolute inset-y-0 left-0 rounded-lg flex items-center justify-end pr-3"
              style={{
                background: i < 3
                  ? `linear-gradient(90deg, ${colors[i]}88, ${colors[i]})`
                  : 'linear-gradient(90deg, #6556ff88, #6556ff)',
              }}
            >
              <span className="text-xs font-black text-white">{s.score}</span>
            </MD>
          </div>
          <span className="w-10 text-xs text-white/40 text-right">{s.class}</span>
        </MD>
      ))}
    </div>
  )
}

// ── Pie Chart (SVG) ──────────────────────────────────────────────────────────
const PIE_COLORS = ['#FFD700','#C0C0C0','#CD7F32','#6556ff','#22d3ee','#f43f5e','#10b981','#f97316','#8b5cf6','#ec4899']

function PieChart({ students }: { students: Student[] }) {
  const top10 = students.slice(0, 10)
  const total = top10.reduce((a, s) => a + s.score, 0) || 1
  const size = 220
  const r = 80
  const cx = size / 2
  const cy = size / 2
  const [hovered, setHovered] = useState<number | null>(null)

  let angle = -Math.PI / 2
  const slices = top10.map((s, i) => {
    const pct = s.score / total
    const start = angle
    angle += pct * 2 * Math.PI
    const end = angle
    const lx = cx + (r + 20) * Math.cos((start + end) / 2)
    const ly = cy + (r + 20) * Math.sin((start + end) / 2)
    return { s, i, pct, start, end, lx, ly }
  })

  return (
    <div className="flex flex-col md:flex-row items-center gap-6">
      <svg width={size} height={size} className="shrink-0">
        {slices.map(({ s, i, start, end, pct }) => {
          const rr = hovered === i ? r + 8 : r
          const x1 = cx + rr * Math.cos(start)
          const y1 = cy + rr * Math.sin(start)
          const x2 = cx + rr * Math.cos(end)
          const y2 = cy + rr * Math.sin(end)
          const large = end - start > Math.PI ? 1 : 0
          return (
            <path
              key={s.ID}
              d={`M${cx},${cy} L${x1},${y1} A${rr},${rr} 0 ${large} 1 ${x2},${y2} Z`}
              fill={PIE_COLORS[i % PIE_COLORS.length]}
              stroke="#0f172a"
              strokeWidth={2}
              style={{ cursor: 'pointer', transition: 'all 0.25s' }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              opacity={hovered === null || hovered === i ? 1 : 0.6}
            />
          )
        })}
        {hovered !== null && (
          <text x={cx} y={cy - 8} textAnchor="middle" fill="white" fontSize={11} fontWeight="bold">
            {top10[hovered]?.fio.split(' ')[0]}
          </text>
        )}
        {hovered !== null && (
          <text x={cx} y={cy + 10} textAnchor="middle" fill="white" fontSize={13} fontWeight="900">
            {top10[hovered]?.score} балл
          </text>
        )}
      </svg>

      <div className="grid grid-cols-1 gap-1.5 text-sm">
        {top10.map((s, i) => (
          <div
            key={s.ID}
            className="flex items-center gap-2 cursor-pointer"
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          >
            <span className="w-3 h-3 rounded-full shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
            <span className="text-white/80 truncate max-w-[160px]">{s.fio}</span>
            <span className="ml-auto font-bold text-white/60">{s.score}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function RatingPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [classes, setClasses] = useState<string[]>([])
  const [activeClass, setActiveClass] = useState<string>('all')
  const [view, setView] = useState<'bar' | 'pie'>('bar')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch(`${GO_API_URL}/api/students`).then(r => r.json()),
      fetch(`${GO_API_URL}/api/students/classes`).then(r => r.json()),
    ]).then(([s, c]) => {
      setStudents(Array.isArray(s) ? s : [])
      setClasses(Array.isArray(c) ? c : [])
    }).finally(() => setLoading(false))
  }, [])

  const filtered = activeClass === 'all'
    ? students
    : students.filter(s => s.class === activeClass)

  const top3 = filtered.slice(0, 3)

  return (
    <div className="min-h-screen bg-[#0a0f1e] pt-28 pb-20 relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute top-20 left-1/4 w-96 h-96 rounded-full opacity-15 blur-3xl pointer-events-none" style={{ background: '#17a589' }} />
      <div className="absolute bottom-40 right-1/4 w-80 h-80 rounded-full opacity-10 blur-3xl pointer-events-none" style={{ background: '#FFD700' }} />

      <div className="container mx-auto px-4 max-w-5xl">

        {/* Header */}
        <MD initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white/60 text-sm font-medium mb-4">
            <Icon icon="solar:cup-bold-duotone" className="text-yellow-400 text-lg" />
            Nice International School
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-3">
            Рейтинг{' '}
            <span style={{ background: 'linear-gradient(90deg,#FFD700,#17a589)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              учеников
            </span>
          </h1>
          <p className="text-white/40 text-base max-w-md mx-auto">
            Лучшие ученики и их достижения
          </p>
        </MD>

        {/* Class filter */}
        <MD initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="flex flex-wrap gap-2 justify-center mb-10">
          <button
            onClick={() => setActiveClass('all')}
            className={`px-4 py-2 rounded-full text-sm font-bold border transition-all ${activeClass === 'all' ? 'bg-white text-[#0a0f1e] border-white' : 'border-white/20 text-white/60 hover:border-white/50 hover:text-white'}`}
          >
            Все
          </button>
          {classes.map(c => (
            <button
              key={c}
              onClick={() => setActiveClass(c)}
              className={`px-4 py-2 rounded-full text-sm font-bold border transition-all ${activeClass === c ? 'bg-white text-[#0a0f1e] border-white' : 'border-white/20 text-white/60 hover:border-white/50 hover:text-white'}`}
            >
              {c} класс
            </button>
          ))}
        </MD>

        {loading ? (
          <div className="text-center py-20 text-white/40">Загрузка...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-white/40">Ученики не найдены</div>
        ) : (
          <>
            {/* 3D Podium */}
            {top3.length >= 1 && (
              <MD initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 }}
                className="mb-12 rounded-3xl p-6 md:p-10"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)' }}
              >
                <h2 className="text-center text-white/50 text-xs font-black uppercase tracking-[4px] mb-8">Топ 3 · Призёры</h2>
                <Podium3D top3={top3} />
              </MD>
            )}

            {/* Chart section */}
            <MD initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="rounded-3xl p-6 md:p-8"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              {/* View toggle */}
              <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <h2 className="text-white font-black text-lg flex items-center gap-2">
                  <Icon icon="solar:chart-bold-duotone" className="text-purple-400 text-xl" />
                  {activeClass === 'all' ? 'Общий рейтинг' : `Рейтинг ${activeClass} класса`}
                </h2>
                <div className="flex gap-2 p-1 rounded-xl bg-white/5 border border-white/10">
                  <button
                    onClick={() => setView('bar')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold transition ${view === 'bar' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'}`}
                  >
                    <Icon icon="solar:chart-2-bold-duotone" />
                    Столбчатая
                  </button>
                  <button
                    onClick={() => setView('pie')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold transition ${view === 'pie' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'}`}
                  >
                    <Icon icon="solar:pie-chart-bold-duotone" />
                    Круговая
                  </button>
                </div>
              </div>

              <AnimatePresence mode="wait">
                {view === 'bar' ? (
                  <MD key="bar" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <BarChart students={filtered} />
                  </MD>
                ) : (
                  <MD key="pie" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                    className="flex justify-center">
                    <PieChart students={filtered} />
                  </MD>
                )}
              </AnimatePresence>
            </MD>

            {/* Total stat */}
            <MD initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
              className="mt-6 grid grid-cols-3 gap-4">
              {[
                { icon: 'solar:users-group-rounded-bold-duotone', label: 'Учеников', value: filtered.length },
                { icon: 'solar:cup-bold-duotone', label: 'Всего баллов', value: filtered.reduce((a, s) => a + s.score, 0) },
                { icon: 'solar:star-bold-duotone', label: 'Средний балл', value: filtered.length ? Math.round(filtered.reduce((a, s) => a + s.score, 0) / filtered.length) : 0 },
              ].map((item, i) => (
                <div key={i} className="rounded-2xl p-4 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <Icon icon={item.icon} className="text-2xl text-purple-400 mx-auto mb-1" />
                  <div className="text-2xl font-black text-white">{item.value}</div>
                  <div className="text-xs text-white/40 mt-0.5">{item.label}</div>
                </div>
              ))}
            </MD>
          </>
        )}
      </div>
    </div>
  )
}
