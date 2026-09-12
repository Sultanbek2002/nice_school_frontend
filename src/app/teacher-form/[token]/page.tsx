'use client'

import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Icon } from '@iconify/react'
import { GO_API_URL } from '@/utils/apiData'

interface CertFile {
  file: File
  preview: string
}

interface FormState {
  fullName: string
  subject: string
  experience: string
  age: string
  bio: string
}

const EMPTY: FormState = { fullName: '', subject: '', experience: '', age: '', bio: '' }

// Телефоны (особенно iPhone) часто сохраняют фото в HEIC — сервер такой формат не принимает.
// Перекодируем в JPEG прямо в браузере (заодно уменьшаем размер под мобильный интернет).
// Safari умеет декодировать HEIC в <img>/canvas нативно, поэтому конвертация работает и для него.
// Если конвертация не удалась (например, файл — PDF) — просто отдаём файл как есть.
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
    // Не смогли декодировать (например, браузер не поддерживает HEIC) — пусть уходит как есть,
    // сервер сам решит, принимать или отклонять по MIME.
    return file
  }
}

export default function TeacherFormPage() {
  const params = useParams<{ token: string }>()
  const token = params?.token as string

  const [status, setStatus] = useState<'checking' | 'valid' | 'invalid' | 'submitted'>('checking')
  const [checkError, setCheckError] = useState('')
  const [form, setForm] = useState<FormState>(EMPTY)
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [certificates, setCertificates] = useState<CertFile[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  useEffect(() => {
    if (!token) return
    fetch(`${GO_API_URL}/api/teacher-form/${token}`)
      .then(async (res) => {
        if (res.ok) {
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

  const handleCertificates = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFiles = Array.from(e.target.files || [])
    e.target.value = ''
    if (!rawFiles.length) return
    const converted = await Promise.all(rawFiles.map((f) => toJpeg(f)))
    const withPreview = converted.map((file) => ({ file, preview: URL.createObjectURL(file) }))
    setCertificates((prev) => [...prev, ...withPreview])
  }

  const removeCertificate = (idx: number) => {
    setCertificates((prev) => {
      URL.revokeObjectURL(prev[idx].preview)
      return prev.filter((_, i) => i !== idx)
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.fullName.trim()) {
      setSubmitError('Укажите ваше имя')
      return
    }
    setSubmitting(true)
    setSubmitError('')
    try {
      const fd = new FormData()
      fd.append('fullName', form.fullName)
      fd.append('subject', form.subject)
      fd.append('experience', form.experience)
      fd.append('age', form.age)
      fd.append('bio', form.bio)
      if (photo) fd.append('photo', photo)
      certificates.forEach((c) => fd.append('certificates', c.file))

      const res = await fetch(`${GO_API_URL}/api/teacher-form/${token}`, {
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
          <h1 className="text-midnight_text leading-tight">Анкета учителя</h1>
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
              в списке учителей на сайте.
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
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  className="w-full p-3 rounded-2xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="Иванова Айгуль"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-black/40 uppercase mb-1.5 block">Предмет</label>
                <input
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="w-full p-3 rounded-2xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="Математика"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-black/40 uppercase mb-1.5 block">Стаж</label>
                <input
                  value={form.experience}
                  onChange={(e) => setForm({ ...form, experience: e.target.value })}
                  className="w-full p-3 rounded-2xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="10 лет"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-black/40 uppercase mb-1.5 block">Возраст</label>
                <input
                  type="number"
                  value={form.age}
                  onChange={(e) => setForm({ ...form, age: e.target.value })}
                  className="w-full p-3 rounded-2xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="35"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-black/40 uppercase mb-1.5 block">О себе</label>
              <textarea
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                className="w-full p-3 rounded-2xl border border-gray-200 bg-white text-sm h-28 resize-none focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="Пару слов о вашем опыте и подходе к преподаванию"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-black/40 uppercase mb-1.5 block">Сертификаты (не обязательно)</label>
              <div className="flex flex-wrap gap-2">
                {certificates.map((c, i) => (
                  <div key={i} className="relative w-16 h-16 rounded-xl overflow-hidden border border-gray-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={c.preview} alt="cert" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeCertificate(i)}
                      className="absolute top-0 right-0 bg-red-500 text-white rounded-bl-lg p-0.5"
                    >
                      <Icon icon="solar:close-circle-bold" width={14} />
                    </button>
                  </div>
                ))}
                <label className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:bg-white/50">
                  <Icon icon="solar:add-circle-bold" width={20} className="text-gray-400" />
                  <input type="file" accept="image/*,application/pdf" multiple className="hidden" onChange={handleCertificates} />
                </label>
              </div>
            </div>

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
