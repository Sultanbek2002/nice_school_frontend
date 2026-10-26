'use client'

import { useEffect, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import {
  GraduationCap, Users, Globe2, ShieldCheck, Sparkles, BookOpen,
  Trophy, HeartHandshake, MapPin, Phone, Mail, Clock, Bus,
  Utensils, FlaskConical, Palette, Dumbbell, Star, CheckCircle2,
} from 'lucide-react'
import { GO_API_URL } from '@/utils/apiData'

interface SchoolInfo {
  address: string; email: string; phones: string
  students_count: number; teachers_count: number; satisfaction_rate: number
  about_years_exp: string; about_hero_title: string; about_hero_subtitle: string
  about_hero_pills: string; about_mission_title: string; about_mission_desc: string
  about_mission_cards: string; about_programs: string; about_campus: string
  about_why_us_title: string; about_why_us_items: string
  about_admission_steps: string; about_pricing: string; about_pricing_note: string
  about_review_text: string; about_review_name: string; about_review_role: string
  about_work_hours: string
}

function parseJ<T>(s: string | undefined, fb: T): T {
  if (!s) return fb
  try { return JSON.parse(s) } catch { return fb }
}

const CAMPUS_ICONS = [FlaskConical, BookOpen, Dumbbell, Palette, Utensils, Bus]

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-md border border-primary/10">
      <CheckCircle2 className="h-4 w-4 text-primary" />
      <span className="text-sm font-bold text-midnight_text">{children}</span>
    </div>
  )
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-md border border-slate-100">
      <div className="text-4xl font-black text-midnight_text">{value}</div>
      <div className="mt-1 text-sm font-medium text-slate-500">{label}</div>
    </div>
  )
}

function FeatureCard({ icon: Icon, title, desc }: { icon: React.ElementType<{ className?: string }>; title: string; desc: string }) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-md border border-slate-100 hover:-translate-y-1 transition-transform">
      <div className="h-12 w-12 rounded-2xl bg-slate-gray flex items-center justify-center">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <h3 className="mt-4 text-base font-black text-midnight_text">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-500">{desc}</p>
    </div>
  )
}

export default function AboutPage() {
  const [info, setInfo] = useState<SchoolInfo | null>(null)
  const locale = useLocale()
  const t = useTranslations('AboutPage')

  useEffect(() => {
    fetch(`${GO_API_URL}/api/school-info?lang=${locale}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => d && setInfo(d))
      .catch(() => {})
  }, [locale])

  const studentsCount = info?.students_count ? `${info.students_count}+` : '345+'
  const teachersCount = info?.teachers_count ? `${info.teachers_count}` : '48'
  const satisfactionRate = info?.satisfaction_rate ? `${info.satisfaction_rate}%` : '98%'
  const yearsExp        = info?.about_years_exp      || '12+'
  // Fallbacks below are shown only until the admin fills these fields in.
  const heroTitle       = info?.about_hero_title     || t('heroTitle')
  const heroSubtitle    = info?.about_hero_subtitle  || t('heroSubtitle')
  const missionTitle    = info?.about_mission_title  || t('missionTitle')
  const missionDesc     = info?.about_mission_desc   || ''
  const whyUsTitle      = info?.about_why_us_title   || t('whyUsTitle')
  const pricingNote     = info?.about_pricing_note   || t('pricingNote')
  const reviewText      = info?.about_review_text    || t('reviewText')
  const reviewName      = info?.about_review_name    || t('reviewName')
  const reviewRole      = info?.about_review_role    || t('reviewRole')
  const workHours       = info?.about_work_hours     || t('workHours')
  const address         = info?.address              || t('address')
  const phone           = info?.phones               || '+996 (555) 123-456'
  const email           = info?.email                || 'hello@nice-school.kg'

  const pills: {text:string}[] = parseJ(info?.about_hero_pills, t.raw('pills'))
  const missionCards: {title:string;desc:string}[] = parseJ(info?.about_mission_cards, t.raw('missionCards'))
  const programs: {age:string;name:string;desc:string}[] = parseJ(info?.about_programs, t.raw('programs'))
  const campusItems: {title:string;desc:string}[] = parseJ(info?.about_campus, t.raw('campus'))
  const whyItems: string[] = parseJ(info?.about_why_us_items, t.raw('whyItems'))
  const steps: {num:string;title:string;desc:string}[] = parseJ(info?.about_admission_steps, t.raw('steps'))
  const pricing: {level:string;price:string}[] = parseJ(info?.about_pricing, t.raw('pricing'))
  const highlight = t('heroHighlight')

  const missionIcons = [GraduationCap, HeartHandshake, Globe2, ShieldCheck]

  return (
    <main className="min-h-screen bg-white">

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-gray via-white to-deep-slate">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="absolute top-10 right-0 h-80 w-80 rounded-full bg-primary/8 blur-3xl pointer-events-none" />
        <div className="container py-10 pt-28">
          <Badge>{t('badgeAbout')}</Badge>
          <div className="mt-6 grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <h1 className="text-5xl md:text-6xl font-black text-midnight_text leading-[1.05] tracking-tight">
                {heroTitle.split(highlight).length > 1 ? (
                  <>{heroTitle.split(highlight)[0]}<span className="text-primary">{highlight}</span>{heroTitle.split(highlight)[1]}</>
                ) : heroTitle}
              </h1>
              <p className="mt-5 text-lg text-slate-600 max-w-xl leading-relaxed">{heroSubtitle}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                {pills.map((p, i) => (
                  <div key={i} className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-md border border-primary/10">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span className="text-sm font-bold text-midnight_text">{p.text}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <StatCard value={yearsExp} label={t('statYears')} />
              <StatCard value={studentsCount} label={t('statStudents')} />
              <StatCard value={teachersCount} label={t('statTeachers')} />
              <StatCard value={satisfactionRate} label={t('statSatisfaction')} />
            </div>
          </div>
        </div>
      </section>

      {/* MISSION */}
      <section className="container py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <Badge>{t('badgeMission')}</Badge>
            <h2 className="mt-4 text-4xl font-black text-midnight_text leading-tight">{missionTitle}</h2>
            {missionDesc && <p className="mt-3 text-slate-500 leading-relaxed">{missionDesc}</p>}
          </div>
          <div className="lg:col-span-2 grid md:grid-cols-2 gap-5">
            {missionCards.map((c, i) => (
              <FeatureCard key={i} icon={missionIcons[i % missionIcons.length]} title={c.title} desc={c.desc} />
            ))}
          </div>
        </div>
      </section>

      {/* PROGRAMS */}
      <section className="bg-slate-gray/60 py-12">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto">
            <Badge>{t('badgePrograms')}</Badge>
            <h2 className="mt-4 text-4xl font-black text-midnight_text">{t('programsTitle')}</h2>
            <p className="mt-2 text-slate-500">{t('programsSubtitle')}</p>
          </div>
          <div className="mt-8 grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {programs.map((p, i) => (
              <div key={i} className="rounded-3xl bg-white p-6 shadow-md border border-slate-100">
                <div className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-black text-primary">{p.age}</div>
                <h3 className="mt-3 text-lg font-black text-midnight_text">{p.name}</h3>
                <p className="mt-2 text-sm text-slate-500 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CAMPUS */}
      <section className="container py-12">
        <div className="text-center max-w-2xl mx-auto">
          <Badge>{t('badgeCampus')}</Badge>
          <h2 className="mt-4 text-4xl font-black text-midnight_text">{t('campusTitle')}</h2>
        </div>
        <div className="mt-8 grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {campusItems.map((c, i) => (
            <FeatureCard key={i} icon={CAMPUS_ICONS[i % CAMPUS_ICONS.length]} title={c.title} desc={c.desc} />
          ))}
        </div>
      </section>

      {/* WHY US */}
      <section className="bg-midnight_text py-12 text-white">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 border border-white/15">
                <Trophy className="h-4 w-4 text-primary" />
                <span className="text-sm font-bold">{t('badgeWhy')}</span>
              </div>
              <h2 className="mt-4 text-4xl font-black leading-tight">
                {whyUsTitle}<br /><span className="text-primary">{t('familiesCount', { count: studentsCount })}</span>
              </h2>
            </div>
            <div className="grid gap-3">
              {whyItems.map((item, i) => (
                <div key={i} className="flex items-start gap-3 rounded-2xl bg-white/5 p-4 border border-white/10">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <span className="text-white/85 font-medium">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ADMISSION */}
      <section className="container py-12">
        <div className="grid lg:grid-cols-2 gap-10">
          <div>
            <Badge>{t('badgeAdmission')}</Badge>
            <h2 className="mt-4 text-4xl font-black text-midnight_text leading-tight">{t('admissionTitle')}</h2>
            <div className="mt-6 space-y-4">
              {steps.map((s, i) => (
                <div key={i} className="flex gap-4 items-start">
                  <div className="h-12 w-12 shrink-0 rounded-2xl bg-primary/10 flex items-center justify-center font-black text-primary text-sm">{s.num}</div>
                  <div className="pt-1">
                    <div className="font-black text-midnight_text">{s.title}</div>
                    <div className="text-sm text-slate-500 mt-0.5">{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-3xl bg-white p-7 shadow-md border border-slate-100 h-fit">
            <h3 className="text-2xl font-black text-midnight_text">{t('pricingTitle')}</h3>
            <p className="mt-1 text-sm text-slate-500">{t('pricingYear')}</p>
            <div className="mt-5 space-y-3">
              {pricing.map((r, i) => (
                <div key={i} className="flex justify-between items-center border-b border-slate-100 pb-3 last:border-0">
                  <span className="text-midnight_text font-semibold">{r.level}</span>
                  <span className="font-black text-primary">{r.price}</span>
                </div>
              ))}
            </div>
            {pricingNote && (
              <div className="mt-5 rounded-2xl bg-primary/8 p-4 text-sm text-midnight_text font-medium">💡 {pricingNote}</div>
            )}
          </div>
        </div>
      </section>

      {/* REVIEW */}
      <section className="container pb-12">
        <div className="rounded-[2rem] bg-gradient-to-br from-slate-gray to-white p-10 md:p-12 shadow-md border border-slate-100">
          <div className="flex gap-1 text-amber-400">
            {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-5 w-5 fill-current" />)}
          </div>
          <p className="mt-4 text-2xl md:text-3xl font-semibold text-midnight_text leading-snug max-w-4xl">{reviewText}</p>
          <div className="mt-5 flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-primary text-white flex items-center justify-center font-black text-lg">{reviewName?.[0] || 'N'}</div>
            <div>
              <div className="font-black text-midnight_text">{reviewName}</div>
              <div className="text-sm text-slate-500">{reviewRole}</div>
            </div>
          </div>
        </div>
      </section>

      {/* CONTACTS */}
      <section className="container pb-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: MapPin, label: t('contactAddress'), value: address },
            { icon: Phone,  label: t('contactPhone'),   value: phone },
            { icon: Mail,   label: t('contactEmail'),   value: email },
            { icon: Clock,  label: t('contactHours'),   value: workHours },
          ].map(({ icon: Icon, label, value }, i) => (
            <div key={i} className="rounded-3xl bg-white p-6 shadow-md border border-slate-100">
              <Icon className="h-6 w-6 text-primary" />
              <div className="mt-3 font-black text-midnight_text">{label}</div>
              <div className="text-sm text-slate-500 mt-1">{value}</div>
            </div>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-midnight_text p-8 text-white">
          <div>
            <div className="text-2xl font-black">{t('openDayTitle')}</div>
            <div className="text-white/60 mt-1">{t('openDayText')}</div>
          </div>
          <Link href="/#contact" className="rounded-full bg-primary hover:brightness-110 transition px-8 py-4 font-black text-white shadow-lg">{t('enroll')}</Link>
        </div>
      </section>

    </main>
  )
}
