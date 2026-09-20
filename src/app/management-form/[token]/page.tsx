'use client'

import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Icon } from '@iconify/react'
import { GO_API_URL } from '@/utils/apiData'

interface FormState {
  name: string
  role: string
  email: string
  phone: string
  experience: string
  education: string
  extraEducation: string
  languages: string
  bio: string
  quote: string
  mission: string
  achievements: string
}

const EMPTY: FormState = {
  name: '', role: '', email: '', phone: '', experience: '', education: '',
  extraEducation: '', languages: '', bio: '', quote: '', mission: '', achievements: '',
}

// Телефоны (особенно iPhone) часто сохраняют фото в HEIC — сервер такой формат не принимает.
// Перекодируем в JPEG прямо в браузере (заодно уменьшаем размер под мобильный интернет).
async function toJpeg(file: File, maxDim = 1600, quality = 0.85): Promise<File> {
  if (file.type === 'application/pdf') return file
  try {
    const bitmap = await createImageBitmap(file).catch(async () => {
      const url = URL.createObjectURL(file)
      try {
        const img = new Image()
        img.src = url
        await new Promise((resolve, reject) => {
          img.onload = resolve
          img.onerror = reject
        })
        return img
      } finally {
        URL.revokeObjectURL(url)
      }
    })
    const w = 'width' in bitmap ? bitmap.width : 0
    const h = 'height' in bitmap ? bitmap.height : 0
    if (!w || !h) return file

    const scale = Math.min(1, maxDim / Math.max(w, h))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(w * scale)
    canvas.height = Math.round(h * scale)
    const ctx = canvas.getContext('2d')
    if (!ctx) return file
    ctx.drawImage(bitmap as CanvasImageSource, 0, 0, canvas.width, canvas.height)

    const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality))
    if (!blob) return file

    const newName = file.name.replace(/\.[^.]+$/, '') + '.jpg'
    return new File([blob], newName, { type: 'image/jpeg' })
  } catch {
    return file
  }
}

export default function ManagementFormPage() {
  const params = useParams<{ token: string }>()
  const token = params?.token as string

  const [status, setStatus] = useState<'checking' | 'valid' | 'invalid' | 'submitted'>('checking')
  const [checkError, setCheckError] = useState('')
  const [kind, setKind] = useState<'director' | 'staff'>('staff')
  const [form, setForm] = useState<FormState>(EMPTY)
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  useEffect(() => {
    if (!token) return
    fetch(`${GO_API_URL}/api/management-form/${token}`)
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json()
          setKind(data.kind === 'director' ? 'director' : 'staff')
          setStatus('valid')
        } else {
          const data = await res.json().catch(() => ({}))
          setCheckError(data.error || 'Ссылка недействительна')
          setStatus('invalid')
        }
      })
      .catch(() => {
        setCheckError('Не удалось проверить ссылку. Проверьте интернет-соединение')
        setStatus('invalid')
      })
  }, [token])

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFile = e.target.files?.[0]
    e.target.value = ''
    if (!rawFile) return
    const file = await toJpeg(rawFile)
    if (photoPreview) URL.revokeObjectURL(photoPreview)
    setPhoto(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) {
      setSubmitError('Укажите ваше имя')
      return
    }
    setSubmitting(true)
    setSubmitError('')
    try {
      const fd = new FormData()
      fd.append('name', form.name)
      fd.append('role', form.role)
      fd.append('email', form.email)
      fd.append('phone', form.phone)
      fd.append('experience', form.experience)
      fd.append('education', form.education)
      fd.append('bio', form.bio)
      if (kind === 'director') {
        fd.append('extra_education', form.extraEducation)
        fd.append('languages', form.languages)
        fd.append('quote', form.quote)
        fd.append('mission', form.mission)
        fd.append('achievements', form.achievements)
      }
      if (photo) fd.append('photo', photo)

      const res = await fetch(`${GO_API_URL}/api/management-form/${token}`, {
        method: 'POST',
        body: fd,
      })

      if (res.ok) {
        setStatus('submitted')
      } else {
        const data = await res.json().catch(() => ({}))
        setSubmitError(data.error || 'Не удалось отправить анкету')
        if (res.status === 410) setStatus('invalid')
      }
    } catch {
      setSubmitError('Не удалось отправить анкету. Проверьте интернет-соединение')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen pt-28 pb-20" style={{ background: '#f2f9f6' }}>
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-midnight_text leading-tight">
            Анкета {kind === 'director' ? 'директора' : 'сотрудника управления'}
          </h1>
          <p className="text-black/50 mt-2 text-sm">Nice International School</p>
        </div>

        {status === 'checking' && (
          <div className="glass-card rounded-3xl p-12 text-center">
            <Icon icon="solar:refresh-bold" className="animate-spin mx-auto text-primary" width={32} />
            <p className="mt-4 text-black/50 text-sm">Проверяем ссылку...</p>
          </div>
        )}

        {status === 'invalid' && (
          <div className="glass-card rounded-3xl p-12 text-center">
            <Icon icon="solar:link-broken-bold" className="mx-auto text-red-400" width={40} />
            <p className="mt-4 font-semibold">{checkError}</p>
            <p className="mt-2 text-sm text-black/40">
              Ссылка одноразовая — если вы уже отправляли анкету, повторно перейти по ней нельзя.
              Обратитесь к администратору школы за новой ссылкой.
            </p>
          </div>
        )}

        {status === 'submitted' && (
          <div className="glass-card rounded-3xl p-12 text-center">
            <Icon icon="solar:check-circle-bold" className="mx-auto text-primary" width={48} />
            <p className="mt-4 text-lg font-bold">Спасибо!</p>
            <p className="mt-2 text-sm text-black/50">
              Ваши данные отправлены на проверку администратору. После одобрения они появятся
              на странице школы.
            </p>
          </div>
        )}

        {status === 'valid' && (
          <form onSubmit={handleSubmit} className="glass-card rounded-3xl p-6 sm:p-8 space-y-5">
            <div className="flex flex-col items-center">
              <label className="cursor-pointer group relative w-28 h-28">
                <div className="w-28 h-28 rounded-full bg-white border-2 border-dashed border-primary/30 flex items-center justify-center overflow-hidden">
                  {photoPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photoPreview} alt="Фото" className="w-full h-full object-cover" />
                  ) : (
                    <Icon icon="solar:user-bold" width={36} className="text-gray-300" />
                  )}
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
              </label>
              <span className="text-xs text-black/40 mt-2 font-semibold uppercase">Ваше фото</span>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-black/40 uppercase mb-1.5 block">Аты-жөнү *</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full p-3 rounded-2xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="Иванова Айгуль"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-black/40 uppercase mb-1.5 block">Должность</label>
                <input
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full p-3 rounded-2xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder={kind === 'director' ? 'Директор школы' : 'Завуч'}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-black/40 uppercase mb-1.5 block">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full p-3 rounded-2xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-black/40 uppercase mb-1.5 block">Телефон</label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full p-3 rounded-2xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-black/40 uppercase mb-1.5 block">Стаж</label>
                <input
                  value={form.experience}
                  onChange={(e) => setForm({ ...form, experience: e.target.value })}
                  className="w-full p-3 rounded-2xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="15 лет"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-black/40 uppercase mb-1.5 block">Образование</label>
                <input
                  value={form.education}
                  onChange={(e) => setForm({ ...form, education: e.target.value })}
                  className="w-full p-3 rounded-2xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
              {kind === 'director' && (
                <>
                  <div>
                    <label className="text-xs font-bold text-black/40 uppercase mb-1.5 block">Доп. образование</label>
                    <input
                      value={form.extraEducation}
                      onChange={(e) => setForm({ ...form, extraEducation: e.target.value })}
                      className="w-full p-3 rounded-2xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-black/40 uppercase mb-1.5 block">Языки</label>
                    <input
                      value={form.languages}
                      onChange={(e) => setForm({ ...form, languages: e.target.value })}
                      className="w-full p-3 rounded-2xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                      placeholder="Кыргызский, Русский, Английский"
                    />
                  </div>
                </>
              )}
            </div>

            <div>
              <label className="text-xs font-bold text-black/40 uppercase mb-1.5 block">О себе</label>
              <textarea
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                className="w-full p-3 rounded-2xl border border-gray-200 bg-white text-sm h-28 resize-none focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="Пару слов о вашем опыте и подходе к работе"
              />
            </div>

            {kind === 'director' && (
              <>
                <div>
                  <label className="text-xs font-bold text-black/40 uppercase mb-1.5 block">Ваша цитата / девиз</label>
                  <input
                    value={form.quote}
                    onChange={(e) => setForm({ ...form, quote: e.target.value })}
                    className="w-full p-3 rounded-2xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-black/40 uppercase mb-1.5 block">Миссия</label>
                  <textarea
                    value={form.mission}
                    onChange={(e) => setForm({ ...form, mission: e.target.value })}
                    className="w-full p-3 rounded-2xl border border-gray-200 bg-white text-sm h-20 resize-none focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-black/40 uppercase mb-1.5 block">Достижения (по одному на строке)</label>
                  <textarea
                    value={form.achievements}
                    onChange={(e) => setForm({ ...form, achievements: e.target.value })}
                    className="w-full p-3 rounded-2xl border border-gray-200 bg-white text-sm h-24 resize-none focus:outline-none focus:ring-2 focus:ring-primary/40"
                    placeholder={'Заслуженный учитель КР\nПобедитель конкурса "Лучший директор"'}
                  />
                </div>
              </>
            )}

            {submitError && (
              <p className="text-sm text-red-500 font-semibold text-center">{submitError}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 bg-primary text-white rounded-2xl font-bold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting && <Icon icon="solar:refresh-bold" className="animate-spin" width={18} />}
              Отправить анкету
            </button>
          </form>
        )}
      </div>
    </main>
  )
}
