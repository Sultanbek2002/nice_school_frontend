'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, GraduationCap, Search, Star, X } from 'lucide-react'

interface Teacher {
  fullName: string
  photo?: string
  subject?: string
  experience?: number
  age?: number
  bio?: string
}

interface MentorProps {
  data?: Teacher[]
  title?: string
}

function teacherSlug(name: string) {
  return encodeURIComponent(name.toLowerCase().replace(/\s+/g, '-'))
}

// ─── Single card ──────────────────────────────────────────────────────────────

function MentorCard({ teacher, index }: { teacher: Teacher; index: number }) {
  const [hovered, setHovered] = useState(false)
  const detailUrl = `/mentors/${teacherSlug(teacher.fullName)}`

  // Last column of 4-col grid opens reveal to the left
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
        className="relative overflow-hidden rounded-3xl bg-white border border-gray-100 transition-all duration-500 cursor-pointer"
        style={{
          transform: hovered ? 'translateY(-8px)' : 'translateY(0)',
          boxShadow: hovered
            ? '0 28px 56px -12px rgba(23,165,137,0.28), 0 8px 16px -6px rgba(23,165,137,0.15)'
            : '0 2px 12px rgba(0,0,0,0.06)',
        }}
      >
        {/* Photo */}
        <div className="relative overflow-hidden" style={{ height: '280px' }}>
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
            className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-xs font-bold backdrop-blur transition-all duration-400"
            style={{
              color: '#17a589',
              opacity: hovered ? 1 : 0,
              transform: hovered ? 'translateY(0)' : 'translateY(-6px)',
            }}
          >
            <Star className="h-3 w-3" style={{ fill: '#17a589', stroke: 'none' }} />
            {teacher.subject}
          </div>

          {/* Bottom gradient */}
          <div
            className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none transition-opacity duration-500"
            style={{
              background: 'linear-gradient(to top, rgba(23,165,137,0.15), transparent)',
              opacity: hovered ? 1 : 0,
            }}
          />
        </div>

        {/* Card footer */}
        <div className="p-5">
          <Link href={detailUrl} onClick={e => e.stopPropagation()}>
            <h4
              className="text-xl font-bold line-clamp-1 transition-colors duration-300"
              style={{ color: hovered ? '#17a589' : '#0c2440' }}
            >
              {teacher.fullName}
            </h4>
          </Link>
          <p className="mt-1 text-xs font-bold uppercase tracking-wide" style={{ color: '#17a589' }}>
            {teacher.subject}
          </p>

          <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
            <span className="text-xs font-bold" style={{ color: '#3f5570' }}>
              СТАЖ: {teacher.experience} ЖЫЛ
            </span>
            <Link
              href={detailUrl}
              onClick={e => e.stopPropagation()}
              className="flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-300 shadow-sm"
              style={{
                background: hovered ? '#17a589' : '#f2f9f6',
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
          width: '17rem',
          height: '100%',
          ...(openLeft
            ? { right: 'calc(100% + 12px)' }
            : { left: 'calc(100% + 12px)' }),
          opacity: hovered ? 1 : 0,
          transform: hovered
            ? 'translateX(0)'
            : openLeft
              ? 'translateX(14px)'
              : 'translateX(-14px)',
          transition: 'opacity 0.38s ease, transform 0.38s cubic-bezier(0.16,1,0.3,1)',
          pointerEvents: hovered ? 'auto' : 'none',
        }}
      >
        <div
          className="relative h-full overflow-hidden rounded-3xl p-6 text-white flex flex-col"
          style={{
            background: 'linear-gradient(145deg, #17a589 0%, #0b6f5d 100%)',
            boxShadow: '0 20px 60px -12px rgba(23,165,137,0.5)',
          }}
        >
          {/* Decorative blurs */}
          <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute bottom-0 left-0 h-20 w-20 rounded-full bg-white/8 blur-xl" />

          {/* Header */}
          <div className="relative flex items-start justify-between mb-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] opacity-65 font-semibold">Ментор</p>
              <h4 className="mt-1 text-lg font-black leading-snug">{teacher.fullName}</h4>
            </div>
            <GraduationCap className="h-5 w-5 opacity-65 shrink-0 mt-1" />
          </div>

          {/* Bio */}
          <p className="relative text-sm leading-relaxed opacity-90 mb-4 line-clamp-4">
            {teacher.bio
              ? teacher.bio
              : `Опытный преподаватель ${(teacher.subject || '').toLowerCase()} с ${teacher.experience}-летним стажем работы.`
            }
          </p>

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
              <div className="text-base font-black line-clamp-1 px-1 leading-tight mt-0.5">
                {teacher.subject}
              </div>
              <div className="text-[9px] uppercase tracking-wider opacity-70 mt-0.5">предмет</div>
            </div>
          </div>

          {/* Tags */}
          <div className="relative flex flex-wrap gap-1.5 mb-4">
            {teacher.age && (
              <span
                className="px-2.5 py-1 rounded-full text-[10px] font-bold"
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
                boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
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

const Mentor: React.FC<MentorProps> = ({ data, title }) => {
  const mentors = Array.isArray(data) ? data : []
  const [search, setSearch] = useState('')

  if (mentors.length === 0) return null

  const q = search.trim().toLowerCase()
  const filtered = q
    ? mentors.filter(t =>
        (t.fullName || '').toLowerCase().includes(q) ||
        (t.subject || '').toLowerCase().includes(q) ||
        String(t.experience || '').includes(q)
      )
    : mentors

  return (
    <section className="py-12 bg-transparent" id="mentor" style={{ overflow: 'visible' }}>
      <div className="container mx-auto px-4" style={{ overflow: 'visible' }}>
        {/* Header row: title + search */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
          {title && (
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-midnight_text shrink-0">
              {title}
            </h2>
          )}
          <div className="relative sm:ml-auto sm:w-72 w-full">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Поиск по имени или предмету..."
              className="w-full pl-10 pr-9 py-2.5 rounded-2xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-gray-300 shadow-sm"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-14">
            <div className="text-5xl mb-3">🔍</div>
            <p className="text-gray-400 font-bold">Ничего не найдено по запросу «{search}»</p>
          </div>
        ) : (
          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
            style={{ overflow: 'visible' }}
          >
            {filtered.map((item: Teacher, i: number) => (
              <MentorCard key={item.fullName + i} teacher={item} index={i} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export default Mentor
