'use client'

import { useEffect, useState } from 'react'
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

function FeatureCard({ icon: Icon, title, desc }: { icon: React.ElementType; title: string; desc: string }) {
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

  useEffect(() => {
    fetch(`${GO_API_URL}/api/school-info`)
      .then(r => r.ok ? r.json() : null)
      .then(d => d && setInfo(d))
      .catch(() => {})
  }, [])

  const studentsCount = info?.students_count ? `${info.students_count}+` : '345+'
  const teachersCount = info?.teachers_count ? `${info.teachers_count}` : '48'
  const satisfactionRate = info?.satisfaction_rate ? `${info.satisfaction_rate}%` : '98%'
  const yearsExp        = info?.about_years_exp      || '12+'
  const heroTitle       = info?.about_hero_title     || 'Место, где рождается будущее ребёнка'
  const heroSubtitle    = info?.about_hero_subtitle  || 'NICE International School — частная международная школа полного дня.'
  const missionTitle    = info?.about_mission_title  || 'Учим думать, а не запоминать'
  const missionDesc     = info?.about_mission_desc   || ''
  const whyUsTitle      = info?.about_why_us_title   || 'Школа, которой доверяют'
  const pricingNote     = info?.about_pricing_note   || 'Скидки для многодетных семей и второго ребёнка — до 20%.'
  const reviewText      = info?.about_review_text    || '«Дочь пошла в NICE два года назад — и я вижу, как она растёт не только в знаниях, но и как личность.»'
  const reviewName      = info?.about_review_name    || 'Айгуль К.'
  const reviewRole      = info?.about_review_role    || 'мама ученицы 4 класса'
  const workHours       = info?.about_work_hours     || 'Пн–Пт, 08:00 – 18:00'
  const address         = info?.address              || 'г. Бишкек, ул. Школьная 12'
  const phone           = info?.phones               || '+996 (555) 123-456'
  const email           = info?.email                || 'hello@nice-school.kg'

  const pills: {text:string}[] = parseJ(info?.about_hero_pills, [
    { text: '3 языка обучения' }, { text: 'до 16 учеников в классе' }, { text: 'охрана 24/7' }
  ])
  const missionCards: {title:string;desc:string}[] = parseJ(info?.about_mission_cards, [
    { title: 'Академическое превосходство', desc: 'Cambridge Primary & Lower Secondary. 92% выпускников поступают в топ-университеты.' },
    { title: 'Индивидуальный путь', desc: 'Персональный тьютор, психологическое сопровождение и адаптивная траектория.' },
    { title: 'Три языка с 1 класса', desc: 'Английский, русский и кыргызский. Носители языка с начальной школы.' },
    { title: 'Безопасная среда', desc: 'Пропускная система, видеонаблюдение, медпункт и психолог в течение всего дня.' },
  ])
  const programs: {age:string;name:string;desc:string}[] = parseJ(info?.about_programs, [
    { age: '3–6 лет',     name: 'Детский сад',     desc: 'Игровое обучение, английский, творчество и подготовка к школе.' },
    { age: '1–4 класс',   name: 'Начальная школа', desc: 'Cambridge Primary, чтение, математика, science.' },
    { age: '5–9 класс',   name: 'Средняя школа',   desc: 'Lower Secondary + IGCSE. Проектная работа, лаборатории.' },
    { age: '10–11 класс', name: 'Старшая школа',   desc: 'A-Level и подготовка к SAT/IELTS.' },
  ])
  const campusItems: {title:string;desc:string}[] = parseJ(info?.about_campus, [
    { title: 'STEM-лаборатории',       desc: 'Физика, химия, биология и робототехника с современным оборудованием.' },
    { title: 'Библиотека и медиатека', desc: '15 000+ книг, тихие зоны для чтения и цифровые ресурсы.' },
    { title: 'Спорт',                  desc: 'Спортзал, футбольное поле, теннис и бассейн рядом со школой.' },
    { title: 'Творческие студии',      desc: 'Изостудия, музыкальные классы, театр и школьный оркестр.' },
    { title: 'Питание',                desc: '4-разовое сбалансированное меню от диетолога.' },
    { title: 'Школьный трансфер',      desc: 'Комфортные автобусы по городу с сопровождающим взрослым.' },
  ])
  const whyItems: string[] = parseJ(info?.about_why_us_items, [
    'Малые классы — максимум внимания каждому',
    'Педагоги с международной сертификацией',
    'Уроки этики, финансовой и цифровой грамотности',
    'Ежемесячные встречи с родителями',
    'Электронный дневник и прозрачная оценка',
  ])
  const steps: {num:string;title:string;desc:string}[] = parseJ(info?.about_admission_steps, [
    { num: '01', title: 'Заявка',      desc: 'Оставьте заявку на сайте или позвоните в приёмную комиссию.' },
    { num: '02', title: 'Знакомство',  desc: 'Экскурсия по школе и встреча с директором и педагогами.' },
    { num: '03', title: 'Диагностика', desc: 'Мягкое тестирование знаний и беседа со школьным психологом.' },
    { num: '04', title: 'Договор',     desc: 'Подписание договора и зачисление в класс.' },
  ])
  const pricing: {level:string;price:string}[] = parseJ(info?.about_pricing, [
    { level: 'Детский сад',     price: 'от 18 000 сом/мес' },
    { level: 'Начальная школа', price: 'от 22 000 сом/мес' },
    { level: 'Средняя школа',   price: 'от 26 000 сом/мес' },
    { level: 'Старшая школа',   price: 'от 30 000 сом/мес' },
  ])

  const missionIcons = [GraduationCap, HeartHandshake, Globe2, ShieldCheck]

  return (
    <main className="min-h-screen bg-white">

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-gray via-white to-deep-slate">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="absolute top-10 right-0 h-80 w-80 rounded-full bg-primary/8 blur-3xl pointer-events-none" />
        <div className="container py-10 pt-28">
          <Badge>О НАШЕЙ ШКОЛЕ</Badge>
          <div className="mt-6 grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <h1 className="text-5xl md:text-6xl font-black text-midnight_text leading-[1.05] tracking-tight">
                {heroTitle.split('будущее ребёнка').length > 1 ? (
                  <>{heroTitle.split('будущее ребёнка')[0]}<span className="text-primary">будущее ребёнка</span>{heroTitle.split('будущее ребёнка')[1]}</>
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
              <StatCard value={yearsExp} label="лет опыта" />
              <StatCard value={studentsCount} label="учеников" />
              <StatCard value={teachersCount} label="педагогов" />
              <StatCard value={satisfactionRate} label="довольных родителей" />
            </div>
          </div>
        </div>
      </section>

      {/* MISSION */}
      <section className="container py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <Badge>МИССИЯ</Badge>
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
            <Badge>ПРОГРАММЫ</Badge>
            <h2 className="mt-4 text-4xl font-black text-midnight_text">От детского сада до выпуска</h2>
            <p className="mt-2 text-slate-500">Единая образовательная траектория с 3 до 18 лет</p>
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
          <Badge>КАМПУС</Badge>
          <h2 className="mt-4 text-4xl font-black text-midnight_text">Инфраструктура мирового уровня</h2>
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
                <span className="text-sm font-bold">ПОЧЕМУ ВЫБИРАЮТ NICE</span>
              </div>
              <h2 className="mt-4 text-4xl font-black leading-tight">
                {whyUsTitle}<br /><span className="text-primary">{studentsCount} семей</span>
              </h2>
            </div>
            <div className="grid gap-3">
              {whyItems.map((t, i) => (
                <div key={i} className="flex items-start gap-3 rounded-2xl bg-white/5 p-4 border border-white/10">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <span className="text-white/85 font-medium">{t}</span>
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
            <Badge>ПРИЁМ</Badge>
            <h2 className="mt-4 text-4xl font-black text-midnight_text leading-tight">Как поступить в NICE</h2>
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
            <h3 className="text-2xl font-black text-midnight_text">Стоимость обучения</h3>
            <p className="mt-1 text-sm text-slate-500">Актуально на 2025–2026 учебный год.</p>
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
            <div className="h-12 w-12 rounded-full bg-primary text-white flex items-center justify-center font-black text-lg">{reviewName?.[0] || 'А'}</div>
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
            { icon: MapPin, label: 'Адрес',        value: address },
            { icon: Phone,  label: 'Телефон',       value: phone },
            { icon: Mail,   label: 'E-mail',        value: email },
            { icon: Clock,  label: 'Часы работы',   value: workHours },
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
            <div className="text-2xl font-black">Приходите на день открытых дверей</div>
            <div className="text-white/60 mt-1">Каждую субботу в 11:00 — бесплатно, с экскурсией по кампусу.</div>
          </div>
          <a href="/#contact" className="rounded-full bg-primary hover:brightness-110 transition px-8 py-4 font-black text-white shadow-lg">Записаться</a>
        </div>
      </section>

    </main>
  )
}
