'use client'

import { useEffect, useState, useMemo, useRef, forwardRef, useImperativeHandle } from 'react'
import { Icon } from '@iconify/react'
import { motion, AnimatePresence } from 'framer-motion'
import { GO_API_URL } from '@/utils/apiData'

const MD = motion.div as any

interface Student {
  ID: number; fio: string; class: string
  score: number; previous_score: number; UpdatedAt: string
}
type Trend = 'up' | 'down' | 'same'

function getTrend(s: Student): Trend {
  if (s.previous_score === 0 || s.score === s.previous_score) return 'same'
  return s.score > s.previous_score ? 'up' : 'down'
}

const MEDAL_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32']
const MEDAL_ICONS  = ['🥇', '🥈', '🥉']
const CONFETTI_COLORS = ['#FFD700','#17a589','#ef4444','#3b82f6','#8b5cf6','#f97316','#ec4899','#06b6d4','#a3e635']

// ── Canvas particle system ────────────────────────────────────────────────────
interface Particle {
  x: number; y: number; vx: number; vy: number
  color: string; size: number; rotation: number; rotSpeed: number
  life: number; maxLife: number; gravity: number; drag: number; isRect: boolean
}

interface CanvasHandle { burst(x: number, y: number, color?: string, count?: number): void; rain(count?: number): void }

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
const CanvasEffects = forwardRef<CanvasHandle, {}>((_, ref) => {
  const cvs = useRef<HTMLCanvasElement>(null)
  const pool = useRef<Particle[]>([])

  useImperativeHandle(ref, () => ({
    burst(x, y, color = '#FFD700', count = 24) {
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2
        const speed = 3 + Math.random() * 5
        pool.current.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color: Math.random() > 0.4 ? color : CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
          size: 4 + Math.random() * 5,
          rotation: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.3,
          life: 60 + Math.random() * 40,
          maxLife: 100,
          gravity: 0.12,
          drag: 0.97,
          isRect: Math.random() > 0.5,
        })
      }
    },
    rain(count = 80) {
      const w = cvs.current?.width ?? window.innerWidth
      for (let i = 0; i < count; i++) {
        const life = 180 + Math.random() * 120
        pool.current.push({
          x: Math.random() * w,
          y: -20 - Math.random() * 200,
          vx: (Math.random() - 0.5) * 2,
          vy: 3 + Math.random() * 4,
          color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
          size: 5 + Math.random() * 7,
          rotation: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.2,
          life, maxLife: life,
          gravity: 0.04,
          drag: 0.995,
          isRect: true,
        })
      }
    },
  }))

  useEffect(() => {
    const canvas = cvs.current!
    let raf: number
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
    resize()
    window.addEventListener('resize', resize)

    const tick = () => {
      const ctx = canvas.getContext('2d')!
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      pool.current = pool.current.filter(p => {
        p.x += p.vx; p.y += p.vy
        p.vy += p.gravity; p.vx *= p.drag
        p.rotation += p.rotSpeed; p.life--
        if (p.life <= 0 || p.y > canvas.height + 40) return false
        const alpha = Math.min(1, p.life / 30) * (p.life / p.maxLife)
        ctx.save()
        ctx.globalAlpha = Math.max(0, alpha)
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rotation)
        ctx.fillStyle = p.color
        if (p.isRect) ctx.fillRect(-p.size, -p.size * 0.4, p.size * 2, p.size * 0.8)
        else { ctx.beginPath(); ctx.arc(0, 0, p.size * 0.6, 0, Math.PI * 2); ctx.fill() }
        ctx.restore()
        return true
      })
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [])

  return <canvas ref={cvs} className="absolute inset-0 pointer-events-none" style={{ zIndex: 15, width: '100%', height: '100%' }} />
})
CanvasEffects.displayName = 'CanvasEffects'

// ── Audio Engine ──────────────────────────────────────────────────────────────
class PodiumAudio {
  private ctx: AudioContext

  constructor(ctx: AudioContext) { this.ctx = ctx }

  private note(freq: number, start: number, dur: number, type: OscillatorType = 'sine', vol = 0.22) {
    const c = this.ctx
    const osc = c.createOscillator()
    const gain = c.createGain()
    osc.type = type
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0, c.currentTime + start)
    gain.gain.linearRampToValueAtTime(vol, c.currentTime + start + 0.02)
    gain.gain.setValueAtTime(vol, c.currentTime + start + dur - 0.04)
    gain.gain.linearRampToValueAtTime(0, c.currentTime + start + dur)
    osc.connect(gain); gain.connect(c.destination)
    osc.start(c.currentTime + start)
    osc.stop(c.currentTime + start + dur + 0.1)
  }

  private drum(start: number, vol = 0.3) {
    const c = this.ctx
    const buf = c.createBuffer(1, Math.floor(c.sampleRate * 0.12), c.sampleRate)
    const d = buf.getChannelData(0)
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 4)
    const src = c.createBufferSource()
    src.buffer = buf
    const gain = c.createGain()
    gain.gain.setValueAtTime(vol, c.currentTime + start)
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + start + 0.12)
    src.connect(gain); gain.connect(c.destination)
    src.start(c.currentTime + start)
  }

  fanfare() {
    const m: [number, number, number, OscillatorType, number][] = [
      [261.63, 0.00, 0.12, 'square', 0.16],
      [329.63, 0.13, 0.12, 'square', 0.16],
      [392.00, 0.26, 0.12, 'square', 0.18],
      [523.25, 0.39, 0.12, 'square', 0.18],
      [659.25, 0.52, 0.12, 'square', 0.20],
      [784.00, 0.65, 0.55, 'square', 0.22],
      [659.25, 1.20, 0.10, 'square', 0.16],
      [784.00, 1.30, 0.75, 'square', 0.22],
      [130.81, 0.00, 2.10, 'sine',   0.10],
      [196.00, 0.00, 2.10, 'sine',   0.08],
    ]
    m.forEach(([f, s, d, t, v]) => this.note(f, s, d, t, v))
    this.drum(0.00, 0.35); this.drum(0.65, 0.45); this.drum(1.30, 0.55)
  }

  tick(pitch: number) { this.note(pitch, 0, 0.07, 'sine', 0.32); this.drum(0, 0.18) }

  blast() {
    [523.25, 659.25, 784.00, 1046.50].forEach((f, i) => this.note(f, i * 0.03, 0.55 - i * 0.04, 'sawtooth', 0.16 - i * 0.01))
    this.note(1046.50, 0.14, 0.85, 'sine', 0.18)
    this.drum(0, 0.55); this.drum(0.10, 0.40); this.drum(0.22, 0.30)
  }

  reveal(place: number) {
    const base = [392.00, 523.25, 659.25][3 - place] ?? 392
    const seq: [number, number, number][] = place === 1
      ? [[base, 0, 0.1], [base * 1.25, 0.1, 0.1], [base * 1.5, 0.2, 0.1], [base * 2, 0.32, 0.9]]
      : [[base, 0, 0.1], [base * 1.25, 0.1, 0.1], [base * 1.5, 0.22, 0.5]]
    seq.forEach(([f, s, d]) => this.note(f, s, d, 'sine', 0.22))
    this.drum(0, 0.38)
    if (place === 1) {
      this.drum(0.32, 0.45); this.drum(0.65, 0.55)
      const ch = [261.63, 329.63, 392.00, 523.25, 659.25]
      ch.forEach((f, i) => this.note(f, 0.38 + i * 0.04, 0.85, 'sine', 0.10))
    }
  }
}

// ── Podium Show Modal ─────────────────────────────────────────────────────────
type Phase = 'intro' | 'cd3' | 'cd2' | 'cd1' | 'bang' | 'third' | 'second' | 'first' | 'done'

const SCHEDULE: { phase: Phase; delay: number }[] = [
  { phase: 'intro',  delay: 0    },
  { phase: 'cd3',    delay: 1800 },
  { phase: 'cd2',    delay: 2800 },
  { phase: 'cd1',    delay: 3800 },
  { phase: 'bang',   delay: 4800 },
  { phase: 'third',  delay: 5700 },
  { phase: 'second', delay: 8700 },
  { phase: 'first',  delay: 11700},
  { phase: 'done',   delay: 14200},
]

const CD_CFG: Record<string, { num: string; color: string; shadow: string }> = {
  cd3: { num: '3', color: '#ef4444', shadow: '#ef444488' },
  cd2: { num: '2', color: '#f97316', shadow: '#f9731688' },
  cd1: { num: '1', color: '#22c55e', shadow: '#22c55e88' },
}

function PodiumShowModal({ top3, audioCtx, onClose }: { top3: Student[]; audioCtx: AudioContext; onClose: () => void }) {
  const [phase, setPhase] = useState<Phase>('intro')
  const canvas = useRef<CanvasHandle>(null)
  const audio = useRef(new PodiumAudio(audioCtx))
  const fwTimer = useRef<NodeJS.Timeout | null>(null)

  const spawnBursts = (count: number, color?: string) => {
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        canvas.current?.burst(
          window.innerWidth * (0.15 + Math.random() * 0.70),
          window.innerHeight * (0.10 + Math.random() * 0.50),
          color,
          20 + Math.floor(Math.random() * 12),
        )
      }, i * 180)
    }
  }

  useEffect(() => {
    audio.current.fanfare()
    canvas.current?.rain(60)

    const timers = SCHEDULE.map(({ phase: p, delay }) =>
      setTimeout(() => {
        setPhase(p)
        if (p === 'cd3') { audio.current.tick(600); canvas.current?.burst(window.innerWidth / 2, window.innerHeight / 2, '#ef4444', 10) }
        if (p === 'cd2') { audio.current.tick(700); canvas.current?.burst(window.innerWidth / 2, window.innerHeight / 2, '#f97316', 10) }
        if (p === 'cd1') { audio.current.tick(900); canvas.current?.burst(window.innerWidth / 2, window.innerHeight / 2, '#22c55e', 10) }
        if (p === 'bang')   { audio.current.blast();    canvas.current?.rain(100); spawnBursts(5) }
        if (p === 'third')  { audio.current.reveal(3);  canvas.current?.rain(60);  spawnBursts(3, '#CD7F32') }
        if (p === 'second') { audio.current.reveal(2);  canvas.current?.rain(80);  spawnBursts(4, '#C0C0C0') }
        if (p === 'first')  { audio.current.reveal(1);  canvas.current?.rain(150); spawnBursts(8, '#FFD700') }
        if (p === 'done')   { canvas.current?.rain(120); spawnBursts(6) }
      }, delay)
    )

    // Continuous fireworks for 1st place
    const startFw = SCHEDULE.find(s => s.phase === 'first')!.delay
    const stopFw  = SCHEDULE.find(s => s.phase === 'done')!.delay + 3000
    const fwStart = setTimeout(() => {
      fwTimer.current = setInterval(() => {
        canvas.current?.burst(
          window.innerWidth * (0.1 + Math.random() * 0.8),
          window.innerHeight * (0.05 + Math.random() * 0.55),
          CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
          18,
        )
      }, 350)
    }, startFw)
    const fwStop = setTimeout(() => { if (fwTimer.current) clearInterval(fwTimer.current) }, stopFw)

    return () => {
      timers.forEach(clearTimeout)
      clearTimeout(fwStart); clearTimeout(fwStop)
      if (fwTimer.current) clearInterval(fwTimer.current)
    }
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at center, #0d1b2e 0%, #050a12 100%)' }}>
      <style>{`
        @keyframes pulse-gold { 0%,100%{box-shadow:0 0 30px #FFD700,0 0 60px #FFD70066} 50%{box-shadow:0 0 60px #FFD700,0 0 100px #FFD700aa} }
        @keyframes float-crown { 0%,100%{transform:translateY(0) rotate(-5deg)} 50%{transform:translateY(-10px) rotate(5deg)} }
      `}</style>

      <CanvasEffects ref={canvas} />

      <button onClick={onClose}
        className="absolute top-4 right-4 z-30 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white transition-all">
        <Icon icon="solar:close-bold" width={20} />
      </button>

      {/* INTRO */}
      <AnimatePresence>
        {phase === 'intro' && (
          <MD key="intro" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.1 }} className="text-center px-6 relative z-20">
            <div className="text-6xl mb-4">🏆</div>
            <p className="text-white/40 text-xs uppercase tracking-[4px] mb-2">NICE International School</p>
            <h2 className="text-3xl md:text-4xl font-black text-white">Объявляем</h2>
            <h2 className="text-3xl md:text-4xl font-black" style={{ background: 'linear-gradient(90deg,#FFD700,#17a589)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>победителей!</h2>
          </MD>
        )}
      </AnimatePresence>

      {/* COUNTDOWN */}
      <AnimatePresence mode="wait">
        {(phase === 'cd3' || phase === 'cd2' || phase === 'cd1') && (() => {
          const cfg = CD_CFG[phase]
          return (
            <MD key={phase} initial={{ scale: 2.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.1, opacity: 0 }} transition={{ duration: 0.3, ease: 'backOut' }} className="relative z-20">
              <div className="text-[160px] md:text-[220px] font-black leading-none select-none" style={{ color: cfg.color, textShadow: `0 0 80px ${cfg.shadow}, 0 0 160px ${cfg.shadow}` }}>
                {cfg.num}
              </div>
            </MD>
          )
        })()}
      </AnimatePresence>

      {/* BANG */}
      <AnimatePresence>
        {phase === 'bang' && (
          <MD key="bang" initial={{ scale: 0, rotate: -15 }} animate={{ scale: [0, 1.5, 1], rotate: [0, 8, -4, 0] }} exit={{ scale: 0, opacity: 0 }} transition={{ duration: 0.55, ease: 'backOut' }} className="relative z-20 text-center">
            <div className="text-6xl md:text-8xl font-black text-white" style={{ textShadow: '0 0 40px #fff, 0 0 80px #fff8' }}>🎉 СТАРТ!</div>
          </MD>
        )}
      </AnimatePresence>

      {/* PLACE REVEALS */}
      <AnimatePresence mode="wait">
        {phase === 'third'  && <PlaceReveal key="third"  student={top3[2]} place={3} />}
        {phase === 'second' && <PlaceReveal key="second" student={top3[1]} place={2} />}
        {phase === 'first'  && <PlaceReveal key="first"  student={top3[0]} place={1} isFirst />}
      </AnimatePresence>

      {/* DONE */}
      <AnimatePresence>
        {phase === 'done' && (
          <MD key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-2xl px-4 relative z-20">
            <h2 className="text-center text-white/40 text-xs font-black uppercase tracking-[4px] mb-8">Поздравляем победителей!</h2>
            <div className="flex items-end justify-center gap-3">
              <MD initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}>
                <PodiumCard student={top3[1]} place={2} height="h-28" />
              </MD>
              <MD initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0, type: 'spring', stiffness: 200 }}>
                <PodiumCard student={top3[0]} place={1} height="h-40" isFirst />
              </MD>
              <MD initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}>
                <PodiumCard student={top3[2]} place={3} height="h-20" />
              </MD>
            </div>
            <div className="text-center mt-8">
              <button onClick={onClose} className="px-8 py-3 rounded-2xl font-black text-sm text-white hover:scale-105 transition-transform"
                style={{ background: 'linear-gradient(135deg,#FFD700,#f97316)', boxShadow: '0 8px 30px #FFD70055' }}>
                Закрыть
              </button>
            </div>
          </MD>
        )}
      </AnimatePresence>
    </div>
  )
}

function PlaceReveal({ student, place, isFirst = false }: { student: Student; place: number; isFirst?: boolean }) {
  const color = MEDAL_COLORS[place - 1]
  const icon  = MEDAL_ICONS[place - 1]
  const label = ['1-е место', '2-е место', '3-е место'][place - 1]
  const parts = student.fio.split(' ')

  return (
    <MD key={`reveal-${place}`} initial={{ y: 100, opacity: 0, scale: 0.85 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: -60, opacity: 0 }}
      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }} className="text-center px-6 w-full max-w-sm mx-auto relative z-20">
      {isFirst && <div className="text-5xl mb-2" style={{ animation: 'float-crown 1.5s ease-in-out infinite' }}>👑</div>}
      <div className="text-6xl mb-3">{icon}</div>
      <div className="text-sm font-black uppercase tracking-[4px] mb-4" style={{ color }}>{label}</div>
      <div className="rounded-3xl p-6 mx-auto" style={{
        background: `linear-gradient(145deg, ${color}1a, ${color}40)`,
        border: `2px solid ${color}`,
        boxShadow: isFirst ? `0 0 60px ${color}66, 0 20px 60px rgba(0,0,0,0.4)` : `0 0 30px ${color}44`,
        animation: isFirst ? 'pulse-gold 2s ease-in-out infinite' : undefined,
      }}>
        <div className={`font-black text-white leading-tight mb-1 ${isFirst ? 'text-3xl md:text-4xl' : 'text-2xl md:text-3xl'}`}>{parts[1] || parts[0]}</div>
        <div className="text-white/50 text-sm font-medium mb-1">{parts[0]}</div>
        <div className="text-white/30 text-xs mb-4">{student.class} класс</div>
        <div className={`font-black ${isFirst ? 'text-5xl md:text-6xl' : 'text-4xl md:text-5xl'}`} style={{ color, textShadow: `0 0 30px ${color}` }}>
          {student.score}<span className="text-base ml-1 opacity-60">балл</span>
        </div>
      </div>
    </MD>
  )
}

function PodiumCard({ student, place, height, isFirst = false }: { student: Student; place: number; height: string; isFirst?: boolean }) {
  const color = MEDAL_COLORS[place - 1]
  const parts = student.fio.split(' ')
  return (
    <div className="flex flex-col items-center gap-1 w-32">
      {isFirst && <div className="text-xl" style={{ animation: 'float-crown 1.5s ease-in-out infinite' }}>👑</div>}
      <div className="text-2xl">{MEDAL_ICONS[place - 1]}</div>
      <div className="font-black text-white text-xs text-center leading-tight truncate w-full">{parts[1] || parts[0]}</div>
      <div className="text-white/40 text-[10px] text-center truncate w-full">{parts[0]}</div>
      <div className={`w-full ${height} rounded-t-2xl flex flex-col items-center justify-center`}
        style={{ background: `linear-gradient(180deg,${color}66,${color}cc)`, border: `2px solid ${color}`, boxShadow: `0 0 20px ${color}55` }}>
        <div className="font-black text-white text-lg" style={{ textShadow: `0 0 10px ${color}` }}>{student.score}</div>
        <div className="text-white/50 text-[10px]">баллов</div>
      </div>
    </div>
  )
}

// ── Compact podium (in-page) ──────────────────────────────────────────────────
function TopPodium({ students }: { students: Student[] }) {
  const order = [1, 0, 2]; const heights = ['h-16', 'h-20', 'h-14']
  return (
    <div className="flex items-end justify-center gap-2 mb-1">
      {order.map((idx, pos) => {
        const s = students[idx]; if (!s) return null
        const color = MEDAL_COLORS[idx]
        const trend = getTrend(s); const delta = Math.abs(s.score - s.previous_score)
        const parts = s.fio.split(' ')
        return (
          <div key={s.ID} className="flex flex-col items-center gap-0.5 w-[30%]">
            <div className="text-lg">{MEDAL_ICONS[idx]}</div>
            <div className="font-black text-xs text-center leading-tight truncate w-full px-1 text-gray-800">{parts[1] || parts[0]}</div>
            <div className="font-medium text-[10px] text-center leading-tight truncate w-full px-1 text-gray-500">{parts[0]}</div>
            {trend !== 'same'
              ? <span className={`text-[10px] font-black ${trend === 'up' ? 'text-emerald-500' : 'text-rose-500'}`}>{trend === 'up' ? '▲' : '▼'} {delta}</span>
              : <span className="text-[10px] text-gray-300">—</span>}
            <div className={`w-full ${heights[pos]} rounded-t-xl flex items-center justify-center font-black text-base`}
              style={{ background: `linear-gradient(180deg,${color}99,${color})`, border: `2px solid ${color}`, color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,0.3)', boxShadow: `0 4px 12px ${color}55` }}>
              {s.score}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function RatingPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [classes, setClasses] = useState<string[]>([])
  const [activeClass, setActiveClass] = useState('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [preparing, setPreparing] = useState(false)
  const [audioCtx, setAudioCtx] = useState<AudioContext | null>(null)

  useEffect(() => {
    Promise.all([
      fetch(`${GO_API_URL}/api/students`).then(r => r.json()),
      fetch(`${GO_API_URL}/api/students/classes`).then(r => r.json()),
    ]).then(([s, c]) => {
      setStudents(Array.isArray(s) ? s : [])
      setClasses(Array.isArray(c) ? c : [])
    }).finally(() => setLoading(false))
  }, [])

  const handleOpenPodium = async () => {
    setPreparing(true)
    // Create and warm up AudioContext on user gesture
    const ctx = new AudioContext()
    if (ctx.state === 'suspended') await ctx.resume()
    // Play a silent note to unlock audio hardware
    const osc = ctx.createOscillator()
    const gain = ctx.createGain(); gain.gain.value = 0
    osc.connect(gain); gain.connect(ctx.destination)
    osc.start(); osc.stop(ctx.currentTime + 0.05)
    // Brief pause to let audio initialize
    await new Promise(r => setTimeout(r, 400))
    setAudioCtx(ctx)
    setPreparing(false)
    setShowModal(true)
  }

  const handleClose = () => {
    setShowModal(false)
    audioCtx?.close().catch(() => {})
    setAudioCtx(null)
  }

  const byScore = useMemo(() => {
    let list = activeClass === 'all' ? students : students.filter(s => s.class === activeClass)
    if (search.trim()) { const q = search.toLowerCase(); list = list.filter(s => s.fio.toLowerCase().includes(q)) }
    return [...list].sort((a, b) => b.score - a.score)
  }, [students, activeClass, search])

  const filtered = useMemo(() => [...byScore].sort((a, b) => {
    const ac = a.score !== a.previous_score, bc = b.score !== b.previous_score
    if (ac && !bc) return -1; if (!ac && bc) return 1
    if (ac && bc) return new Date(b.UpdatedAt).getTime() - new Date(a.UpdatedAt).getTime()
    return b.score - a.score
  }), [byScore])

  const top3 = byScore.slice(0, 3)
  const maxScore = byScore[0]?.score || 1
  const avgScore = byScore.length ? Math.round(byScore.reduce((a, s) => a + s.score, 0) / byScore.length) : 0

  return (
    <div className="min-h-screen pt-20 pb-8" style={{ background: 'linear-gradient(135deg,#f2f9f6 0%,#eef7f5 50%,#f5f9ff 100%)' }}>
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-10 left-1/4 w-80 h-80 rounded-full opacity-20 blur-3xl" style={{ background: '#17a589' }} />
        <div className="absolute bottom-20 right-1/4 w-64 h-64 rounded-full opacity-10 blur-3xl" style={{ background: '#FFD700' }} />
      </div>

      <AnimatePresence>
        {showModal && audioCtx && top3.length >= 3 && (
          <PodiumShowModal top3={top3} audioCtx={audioCtx} onClose={handleClose} />
        )}
      </AnimatePresence>

      <div className="container mx-auto px-3 max-w-4xl relative z-10">

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1">
            <h1 className="text-xl lg:text-2xl font-black text-gray-800 leading-tight">
              Рейтинг <span style={{ background: 'linear-gradient(90deg,#f59e0b,#17a589)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>учеников</span>
            </h1>
            <p className="text-gray-400 text-[11px] lg:text-xs">NICE International School</p>
          </div>

          {top3.length >= 3 && (
            <button onClick={handleOpenPodium} disabled={preparing}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-black text-xs text-white transition-all hover:scale-105 hover:shadow-lg active:scale-95 disabled:opacity-70 disabled:cursor-wait"
              style={{ background: 'linear-gradient(135deg,#FFD700,#f97316)', boxShadow: '0 4px 15px #FFD70044' }}>
              {preparing ? (
                <><svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="30 70" /></svg> Подготовка...</>
              ) : 'Подиум'}
            </button>
          )}

          <div className="relative">
            <Icon icon="solar:magnifer-linear" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск..."
              className="bg-white border border-gray-200 rounded-xl pl-8 pr-3 py-2 text-gray-800 text-xs placeholder:text-gray-400 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 w-40 md:w-52 shadow-sm" />
            {search && <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><Icon icon="solar:close-circle-bold" width={14} /></button>}
          </div>
        </div>

        {/* Class filter */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {['all', ...classes].map(c => (
            <button key={c} onClick={() => setActiveClass(c)}
              className={`px-3 lg:px-4 py-1 lg:py-1.5 rounded-full text-[11px] lg:text-xs font-bold border transition-all ${activeClass === c ? 'bg-primary text-white border-primary shadow-sm shadow-primary/20' : 'border-gray-200 text-gray-500 bg-white hover:border-primary/40 hover:text-primary'}`}>
              {c === 'all' ? 'Все' : `${c} кл.`}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-400 text-sm">Загрузка...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400 text-sm">{search ? `Ничего не найдено по «${search}»` : 'Ученики не найдены'}</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-4">

            <div className="space-y-3">
              {top3.length >= 2 && (
                <div className="bg-white rounded-2xl p-4 pb-2 shadow-sm border border-gray-100">
                  <p className="text-gray-400 text-[9px] lg:text-[10px] font-black uppercase tracking-[3px] text-center mb-3">Топ 3</p>
                  <TopPodium students={top3} />
                </div>
              )}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { icon: 'solar:users-group-rounded-bold-duotone', label: 'Учеников', value: byScore.length, color: 'text-cyan-500', bg: 'bg-cyan-50' },
                  { icon: 'solar:cup-bold-duotone', label: 'Сред. балл', value: avgScore, color: 'text-amber-500', bg: 'bg-amber-50' },
                  { icon: 'solar:star-bold-duotone', label: 'Макс.', value: maxScore, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                ].map((item, i) => (
                  <div key={i} className="bg-white rounded-xl p-2.5 text-center shadow-sm border border-gray-100">
                    <div className={`inline-flex items-center justify-center w-7 h-7 lg:w-9 lg:h-9 rounded-lg ${item.bg} mb-1`}>
                      <Icon icon={item.icon} className={`text-base lg:text-xl ${item.color}`} />
                    </div>
                    <div className={`text-sm lg:text-base font-black ${item.color}`}>{item.value}</div>
                    <div className="text-[9px] lg:text-[11px] text-gray-400 font-medium">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
              <div className="grid grid-cols-[28px_1fr_40px_52px_36px] lg:grid-cols-[36px_1fr_52px_64px_44px] gap-2 lg:gap-3 px-3 lg:px-5 py-2 lg:py-3 border-b border-gray-100 text-[9px] lg:text-[11px] font-black text-gray-400 uppercase tracking-widest">
                <span>#</span><span>Ученик</span>
                <span className="text-center">Класс</span>
                <span className="text-right">Баллы</span>
                <span className="text-center">Рост</span>
              </div>
              <div className="overflow-y-auto max-h-[calc(100vh-280px)]">
                <AnimatePresence>
                  {filtered.map((s, i) => {
                    const rank = byScore.findIndex(x => x.ID === s.ID) + 1
                    const trend = getTrend(s); const delta = Math.abs(s.score - s.previous_score)
                    const barPct = (s.score / maxScore) * 100
                    const medalColor = rank === 1 ? '#FFD700' : rank === 2 ? '#9ca3af' : rank === 3 ? '#CD7F32' : null
                    const recentlyChanged = trend !== 'same'
                    return (
                      <MD key={s.ID} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ delay: i * 0.015 }}
                        className={`grid grid-cols-[28px_1fr_40px_52px_36px] lg:grid-cols-[36px_1fr_52px_64px_44px] gap-2 lg:gap-3 px-3 lg:px-5 py-2 lg:py-3 items-center border-b border-gray-50 hover:bg-gray-50 transition-colors ${recentlyChanged ? 'bg-emerald-50/40' : ''}`}>
                        <span className="text-xs lg:text-sm font-black text-center" style={{ color: medalColor ?? '#d1d5db' }}>{rank}</span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs lg:text-sm font-semibold text-gray-800 truncate">{s.fio}</span>
                            {recentlyChanged && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 animate-pulse" />}
                          </div>
                          <div className="relative h-1 rounded-full bg-gray-100 mt-1">
                            <MD initial={{ width: 0 }} animate={{ width: `${barPct}%` }} transition={{ duration: 0.6, delay: i * 0.015 }}
                              className="absolute inset-y-0 left-0 rounded-full" style={{ background: medalColor ?? '#17a589' }} />
                          </div>
                        </div>
                        <span className="text-[10px] lg:text-xs text-gray-400 text-center">{s.class}</span>
                        <span className="text-sm lg:text-base font-black text-right" style={{ color: medalColor ?? '#374151' }}>{s.score}</span>
                        <div className="flex justify-center">
                          {trend === 'up'   && <span className="flex flex-col items-center text-emerald-500"><Icon icon="solar:arrow-up-bold" width={12} /><span className="text-[8px] lg:text-[10px] font-black leading-none">+{delta}</span></span>}
                          {trend === 'down' && <span className="flex flex-col items-center text-rose-500"><Icon icon="solar:arrow-down-bold" width={12} /><span className="text-[8px] lg:text-[10px] font-black leading-none">{delta}</span></span>}
                          {trend === 'same' && <Icon icon="solar:minus-bold" width={12} className="text-gray-300" />}
                        </div>
                      </MD>
                    )
                  })}
                </AnimatePresence>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
