'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Icon } from '@iconify/react'
import { GO_API_URL } from '@/utils/apiData'

interface Director {
  ID: number
  name: string; role: string; email: string; phone: string
  experience: string; education: string; extra_education: string
  languages: string; bio: string; quote: string; mission: string
  achievements: string; photo: string
}

interface Staff {
  ID: number
  role: string; name: string; email: string; phone: string
  experience: string; education: string; bio: string
  photo: string; sort_order: number
}

function InfoCard({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl p-3" style={{ background: '#f0faf4' }}>
      <Icon icon={icon} className="mt-0.5 shrink-0 text-lg" style={{ color: '#10a870' }} />
      <span className="text-sm" style={{ color: '#0b3b2e' }}>{text}</span>
    </div>
  )
}

export default function ManagementPage() {
  const [director, setDirector] = useState<Director | null>(null)
  const [staff, setStaff] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${GO_API_URL}/api/management`)
      .then(r => r.json())
      .then(d => {
        setDirector(d.director?.ID ? d.director : null)
        setStaff(Array.isArray(d.staff) ? d.staff : [])
      })
      .finally(() => setLoading(false))
  }, [])

  const achievements: string[] = (() => {
    try { return JSON.parse(director?.achievements || '[]') } catch { return [] }
  })()

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#f3fbf6' }}>
      <div className="text-center text-gray-400">Загрузка...</div>
    </div>
  )

  return (
    <div className="min-h-screen" style={{
      background: 'radial-gradient(1200px 600px at 10% -10%,#d7f5e6 0%,transparent 60%), radial-gradient(1000px 500px at 100% 10%,#c9f0dc 0%,transparent 55%), linear-gradient(180deg,#f3fbf6 0%,#eaf7f0 100%)'
    }}>
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">

        {/* Заголовок */}
        <header className="mb-14 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest shadow-sm backdrop-blur" style={{ color: '#10a870' }}>
            <Icon icon="solar:star-shine-bold" width={14} />
            NICE International School
          </span>
          <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-6xl" style={{ color: '#0b3b2e' }}>
            Управление школы
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base sm:text-lg" style={{ color: '#3f6b5a' }}>
            Команда профессионалов, которая делает школу NICE лучшей каждый день.
          </p>
        </header>

        {/* Директор */}
        {director && (
          <article className="mb-12 overflow-hidden rounded-3xl bg-white shadow-[0_20px_60px_-20px_rgba(16,168,112,0.45)] ring-1 ring-black/5">
            <div className="grid gap-0 lg:grid-cols-[minmax(300px,400px)_1fr]">

              {/* Фото */}
              <div className="relative aspect-[4/5] w-full overflow-hidden lg:aspect-auto" style={{ background: 'linear-gradient(135deg,#d7f5e6 0%,#a8e6c8 100%)' }}>
                {director.photo ? (
                  <Image src={director.photo} alt={director.name} fill className="object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Icon icon="solar:user-bold-duotone" className="text-8xl opacity-30" style={{ color: '#10a870' }} />
                  </div>
                )}
                <div className="absolute left-4 top-4">
                  <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-md" style={{ background: 'linear-gradient(135deg,#10a870 0%,#0b8256 100%)' }}>
                    {director.role || 'Директор школы'}
                  </span>
                </div>
              </div>

              {/* Данные */}
              <div className="p-6 sm:p-10">
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl" style={{ color: '#0b3b2e' }}>{director.name}</h2>

                {director.quote && (
                  <div className="relative mt-5 rounded-2xl p-5 pl-12" style={{ background: '#f0faf4' }}>
                    <Icon icon="solar:quote-up-bold-duotone" className="absolute left-4 top-4 text-2xl" style={{ color: '#10a870' }} />
                    <p className="text-base italic leading-relaxed" style={{ color: '#0b3b2e' }}>«{director.quote}»</p>
                  </div>
                )}

                {director.bio && (
                  <p className="mt-5 text-sm leading-relaxed sm:text-base" style={{ color: '#3f6b5a' }}>{director.bio}</p>
                )}

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {director.experience    && <InfoCard icon="solar:bag-5-bold-duotone"       text={director.experience} />}
                  {director.education     && <InfoCard icon="solar:diploma-bold-duotone"     text={director.education} />}
                  {director.extra_education && <InfoCard icon="solar:medal-ribbons-bold-duotone" text={director.extra_education} />}
                  {director.languages     && <InfoCard icon="solar:global-bold-duotone"      text={`Языки: ${director.languages}`} />}
                </div>

                {achievements.length > 0 && (
                  <div className="mt-6">
                    <h3 className="mb-3 text-sm font-bold uppercase tracking-wider" style={{ color: '#10a870' }}>Достижения</h3>
                    <ul className="grid gap-2 sm:grid-cols-2">
                      {achievements.map((a, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm" style={{ color: '#0b3b2e' }}>
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: '#10a870' }} />
                          {a}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {director.mission && (
                  <div className="mt-6 rounded-2xl p-5" style={{ background: 'linear-gradient(135deg,#10a870 0%,#0b8256 100%)' }}>
                    <p className="text-xs font-bold uppercase tracking-wider text-white/80">Миссия директора</p>
                    <p className="mt-2 text-sm leading-relaxed text-white sm:text-base">{director.mission}</p>
                  </div>
                )}

                <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 border-t pt-5 text-sm" style={{ borderColor: '#e3f2ea' }}>
                  {director.email && (
                    <Link href={`mailto:${director.email}`} className="inline-flex items-center gap-2 font-medium" style={{ color: '#0b3b2e' }}>
                      <Icon icon="solar:mailbox-bold" style={{ color: '#10a870' }} />
                      {director.email}
                    </Link>
                  )}
                  {director.phone && (
                    <Link href={`tel:${director.phone.replace(/\s+/g, '')}`} className="inline-flex items-center gap-2 font-medium" style={{ color: '#0b3b2e' }}>
                      <Icon icon="solar:phone-bold" style={{ color: '#10a870' }} />
                      {director.phone}
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </article>
        )}

        {/* Сотрудники */}
        {staff.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {staff.map(person => (
              <article key={person.ID} className="group overflow-hidden rounded-3xl bg-white shadow-[0_10px_40px_-15px_rgba(16,168,112,0.35)] ring-1 ring-black/5 transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_60px_-20px_rgba(16,168,112,0.5)]">
                <div className="relative aspect-[4/5] w-full overflow-hidden" style={{ background: 'linear-gradient(135deg,#d7f5e6 0%,#a8e6c8 100%)' }}>
                  {person.photo ? (
                    <Image src={person.photo} alt={person.name || 'Сотрудник'} fill className="object-cover transition duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Icon icon="solar:user-bold-duotone" className="text-6xl opacity-30" style={{ color: '#10a870' }} />
                    </div>
                  )}
                  <div className="absolute left-4 top-4">
                    <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-md" style={{ background: 'linear-gradient(135deg,#10a870 0%,#0b8256 100%)' }}>
                      {person.role}
                    </span>
                  </div>
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/40 to-transparent" />
                  <h2 className="absolute bottom-4 left-5 right-5 text-xl font-bold text-white drop-shadow">{person.name}</h2>
                </div>

                <div className="p-5">
                  {person.bio && <p className="text-sm leading-relaxed" style={{ color: '#3f6b5a' }}>{person.bio}</p>}
                  <div className="mt-4 space-y-2 text-sm">
                    {person.experience && (
                      <div className="flex items-start gap-2">
                        <Icon icon="solar:bag-5-bold-duotone" className="mt-0.5 shrink-0" style={{ color: '#10a870' }} />
                        <span style={{ color: '#0b3b2e' }}>{person.experience}</span>
                      </div>
                    )}
                    {person.education && (
                      <div className="flex items-start gap-2">
                        <Icon icon="solar:diploma-bold-duotone" className="mt-0.5 shrink-0" style={{ color: '#10a870' }} />
                        <span style={{ color: '#0b3b2e' }}>{person.education}</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 flex flex-col gap-1.5 border-t pt-4 text-sm" style={{ borderColor: '#e3f2ea' }}>
                    {person.email && (
                      <Link href={`mailto:${person.email}`} className="inline-flex items-center gap-2 font-medium" style={{ color: '#0b3b2e' }}>
                        <Icon icon="solar:mailbox-bold" style={{ color: '#10a870' }} />
                        {person.email}
                      </Link>
                    )}
                    {person.phone && (
                      <Link href={`tel:${person.phone.replace(/\s+/g, '')}`} className="inline-flex items-center gap-2 font-medium" style={{ color: '#0b3b2e' }}>
                        <Icon icon="solar:phone-bold" style={{ color: '#10a870' }} />
                        {person.phone}
                      </Link>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {!director && staff.length === 0 && (
          <div className="text-center py-20 text-gray-400">Данные об управлении ещё не добавлены</div>
        )}
      </div>
    </div>
  )
}
