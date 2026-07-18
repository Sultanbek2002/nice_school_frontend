'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, GraduationCap, Star } from 'lucide-react'

interface Teacher {
  fullName: string
  photo?: string
  subject?: string
  experience?: number
  age?: number
  bio?: string
}

interface MentorProps {
  teachers?: Teacher[]
}

function teacherSlug(name: string) {
  return encodeURIComponent(name.toLowerCase().trim().replace(/\s+/g, '-'))
}

// ─── Single card ──────────────────────────────────────────────────────────────

function MentorCard({ teacher, index }: { teacher: Teacher; index: number }) {
  const [hovered, setHovered] = useState(false)
  const detailUrl = `/mentors/${teacherSlug(teacher.fullName)}`

  // Last column (index % 4 === 3) opens left to avoid off-screen overflow
  const openLeft = index % 4 === 3

  return (
    <div
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ zIndex: hovered ? 50 : 1 }}
    >
      {/* ── Main card ── */}
      <div
        className="relative overflow-hidden rounded-3xl glass-card transition-all duration-500 cursor-pointer"
        style={{
          transform: hovered ? 'translateY(-8px)' : 'translateY(0)',
          boxShadow: hovered
            ? '0 28px 56px -12px rgba(23,165,137,0.28), 0 8px 16px -6px rgba(23,165,137,0.18)'
            : undefined,
        }}
      >
        {/* Photo */}
        <div className="relative aspect-[3/4] overflow-hidden">
          <Image
            src={teacher.photo || '/images/mentor/placeholder.webp'}
            alt={teacher.fullName}
            fill
            className="object-cover transition-all duration-700"
            style={{
              filter: hovered ? 'grayscale(0%)' : 'grayscale(100%)',
              transform: hovered ? 'scale(1.08)' : 'scale(1)',
            }}
          />
          {/* Subject badge — appears on hover */}
          <div
            className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-xs font-bold backdrop-blur transition-all duration-500"
            style={{ color: '#17a589', opacity: hovered ? 1 : 0, transform: hovered ? 'translateY(0)' : 'translateY(-6px)' }}
          >
            <Star className="h-3 w-3" style={{ fill: '#17a589' }} />
            {teacher.subject}
          </div>
        </div>

        {/* Card footer */}
        <div className="p-5">
          <Link href={detailUrl} onClick={e => e.stopPropagation()}>
            <h3
              className="text-lg font-bold line-clamp-1 transition-colors duration-300"
              style={{ color: hovered ? '#17a589' : '#0c2440' }}
            >
              {teacher.fullName}
            </h3>
          </Link>
          <p className="mt-1 text-xs font-bold uppercase tracking-wider" style={{ color: '#17a589' }}>
            {teacher.subject}
          </p>
          <div className="mt-5 flex items-center justify-between">
            <span className="text-xs uppercase tracking-wide" style={{ color: '#3f5570' }}>
              Стаж: {teacher.experience} жыл
            </span>
            <Link
              href={detailUrl}
              onClick={e => e.stopPropagation()}
              className="flex h-8 w-8 items-center justify-center rounded-full border transition-all duration-300"
              style={{
                borderColor: 'rgba(23,165,137,0.4)',
                background: hovered ? '#17a589' : 'transparent',
                color: hovered ? 'white' : '#17a589',
              }}
            >
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* ── Reveal panel (desktop only) ── */}
      <div
        className="pointer-events-none absolute top-0 hidden md:block"
        style={{
          width: '18rem',
          height: '100%',
          ...(openLeft
            ? { right: 'calc(100% + 14px)' }
            : { left: 'calc(100% + 14px)' }),
          opacity: hovered ? 1 : 0,
          transform: hovered
            ? 'translateX(0)'
            : openLeft
              ? 'translateX(16px)'
              : 'translateX(-16px)',
          transition: 'opacity 0.4s ease, transform 0.4s cubic-bezier(0.16,1,0.3,1)',
          pointerEvents: hovered ? 'auto' : 'none',
        }}
      >
        <div
          className="relative h-full overflow-hidden rounded-3xl p-6 text-white shadow-2xl flex flex-col"
          style={{
            background: 'linear-gradient(145deg, #17a589 0%, #0b6f5d 100%)',
            boxShadow: '0 24px 64px -12px rgba(23,165,137,0.5)',
          }}
        >
          {/* Decorative blurs */}
          <div className="pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute bottom-0 left-0 h-24 w-24 rounded-full bg-white/8 blur-xl" />

          {/* Header */}
          <div className="relative flex items-start justify-between mb-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] opacity-65 font-semibold">Ментор</p>
              <h4 className="mt-1 text-lg font-black leading-snug">{teacher.fullName}</h4>
            </div>
            <GraduationCap className="h-5 w-5 opacity-65 shrink-0 mt-1" />
          </div>

          {/* Bio */}
          {teacher.bio ? (
            <p className="relative text-sm leading-relaxed opacity-90 mb-4 line-clamp-4">
              {teacher.bio}
            </p>
          ) : (
            <p className="relative text-sm leading-relaxed opacity-60 mb-4 italic">
              Опытный преподаватель {teacher.subject?.toLowerCase()} с {teacher.experience}-летним стажем.
            </p>
          )}

          {/* Stats */}
          <div
            className="relative grid grid-cols-2 gap-2 rounded-2xl p-3 mb-4"
            style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)' }}
          >
            <div className="text-center">
              <div className="text-xl font-black">{teacher.experience}</div>
              <div className="text-[9px] uppercase tracking-wider opacity-70 mt-0.5">лет стажа</div>
            </div>
            <div className="text-center border-l border-white/20">
              <div className="text-xl font-black line-clamp-1 px-1">{(teacher.subject || '').split(' ')[0]}</div>
              <div className="text-[9px] uppercase tracking-wider opacity-70 mt-0.5">предмет</div>
            </div>
          </div>

          {/* Subject tag */}
          <div className="relative flex flex-wrap gap-1.5 mb-4">
            <span
              className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide"
              style={{ background: 'rgba(255,255,255,0.15)' }}
            >
              {teacher.subject}
            </span>
            {teacher.age && (
              <span
                className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide"
                style={{ background: 'rgba(255,255,255,0.15)' }}
              >
                {teacher.age} лет
              </span>
            )}
          </div>

          {/* CTA */}
          <div className="relative mt-auto">
            <Link
              href={detailUrl}
              className="flex items-center justify-center gap-2 rounded-full py-3 text-sm font-black transition-all duration-300 hover:scale-105"
              style={{
                background: 'white',
                color: '#17a589',
                boxShadow: '0 4px 14px rgba(0,0,0,0.12)',
              }}
            >
              Подробнее →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Section ──────────────────────────────────────────────────────────────────

const Mentor: React.FC<MentorProps> = ({ teachers = [] }) => {
  if (!teachers || teachers.length === 0) return null

  return (
    <section className="py-14 scroll-mt-12" id="mentor" style={{ overflow: 'visible' }}>
      <div className="container relative mx-auto px-4" style={{ overflow: 'visible' }}>
        <h2 className="text-midnight_text max-w-96 leading-12 lg:leading-14 mb-10">
          Наши учителя
        </h2>

        {/* Grid replaces react-slick so the reveal panel isn't clipped */}
        <div
          className="grid grid-cols-1 gap-6 xs:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          style={{ overflow: 'visible' }}
        >
          {teachers.map((teacher, i) => (
            <MentorCard key={teacher.fullName + i} teacher={teacher} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}

export default Mentor
