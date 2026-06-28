'use client'
import React, { useState, useEffect } from 'react'
import { Icon } from '@iconify/react'

const ContactForm = () => {
  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    email: '',
    phnumber: '',
    Message: '',
  })
  const [loader, setLoader] = useState(false)
  const [showThanks, setShowThanks] = useState(false)
  const [isFormValid, setIsFormValid] = useState(false)

  useEffect(() => {
    const isValid = Object.values(formData).every((value) => value.trim() !== '')
    setIsFormValid(isValid)
  }, [formData])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const resetForm = () => {
    setFormData({ firstname: '', lastname: '', email: '', phnumber: '', Message: '' })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoader(true)

    // Данные для отправки
    const payload = {
      firstname: formData.firstname,
      lastname: formData.lastname,
      email: formData.email,
      phone: formData.phnumber, // Убедитесь, что на бэкенде поле называется именно так
      message: formData.Message,
    }

    try {
      // Отправляем на ваш локальный или рабочий сервер Go
      const res = await fetch('http://localhost:8080/api/contact', { // Если Next.js проксирует, или полный URL http://localhost:8080/contact
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        setShowThanks(true)
        resetForm()
        setTimeout(() => setShowThanks(false), 5000)
      } else {
        const errorData = await res.json()
        alert(`Произошла ошибка: ${errorData.message || 'Не удалось отправить данные на сервер'}`)
      }
    } catch (error) {
      console.error('Ошибка при отправке:', error)
      alert('Сетевая ошибка. Пожалуйста, проверьте подключение к интернету.')
    } finally {
      setLoader(false)
    }
  }

  return (
    <section id='contact' className='scroll-mt-12 py-10'>
      <div className='container'>
        <div className='grid grid-cols-12'>
          {/* Используем тот же фоновый класс, что и в Newsletter */}
          <div className='col-span-12 bg-newsletter-bg bg-cover bg-no-repeat rounded-3xl px-6 py-60 md:py-30 md:px-12 lg:px-24 shadow-xl'>

            <div className='max-w-4xl mx-auto'>
              <div className='text-center mb-10'>
                {/* text-2xl для мобильных, md:text-4xl для планшетов и выше */}
                <h2 className='text-white text-2xl md:text-4xl font-semibold mb-3'>
                  Свяжитесь с нами
                </h2>
                <p className='text-white/75 text-sm md:text-base capitalize'>
                  Если у вас возникли вопросы, оставьте сообщение, и мы ответим вам в ближайшее время.
                </p>
              </div>

              <form onSubmit={handleSubmit} className='space-y-5'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
                  <input
                    type='text'
                    name='firstname'
                    placeholder='Ваше имя'
                    value={formData.firstname}
                    onChange={handleChange}
                    className='py-4 px-8 text-lg w-full bg-white text-black rounded-full border border-white/10 focus:outline-none focus:border-secondary duration-300 shadow-input-shadow'
                  />
                  <input
                    type='text'
                    name='lastname'
                    placeholder='Ваша фамилия'
                    value={formData.lastname}
                    onChange={handleChange}
                    className='py-4 px-8 text-lg w-full bg-white text-black rounded-full border border-white/10 focus:outline-none focus:border-secondary duration-300 shadow-input-shadow'
                  />
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
                  <input
                    type='email'
                    name='email'
                    placeholder='Электронная почта'
                    value={formData.email}
                    onChange={handleChange}
                    className='py-4 px-8 text-lg w-full bg-white text-black rounded-full border border-white/10 focus:outline-none focus:border-secondary duration-300 shadow-input-shadow'
                  />
                  <input
                    type='tel'
                    name='phnumber'
                    placeholder='Номер вашего телефона'
                    value={formData.phnumber}
                    onChange={handleChange}
                    className='py-4 px-8 text-lg w-full bg-white text-black rounded-full border border-white/10 focus:outline-none focus:border-secondary duration-300 shadow-input-shadow'
                  />
                </div>

                <div className='relative'>
                  <textarea
                    name='Message'
                    placeholder='Ваше сообщение...'
                    rows={3}
                    value={formData.Message}
                    onChange={handleChange}
                    className='py-4 px-8 text-lg w-full bg-white text-black rounded-[2rem] border border-white/10 focus:outline-none focus:border-secondary duration-300 shadow-input-shadow resize-none'
                  ></textarea>

                  <button
                    type='submit'
                    disabled={!isFormValid || loader}
                    className={`group absolute right-3 bottom-3 p-4 rounded-full duration-300 shadow-lg flex items-center justify-center
                      ${!isFormValid || loader
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-secondary hover:bg-white border border-secondary cursor-pointer'}`}
                  >
                    {loader ? (
                      <div className='w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                    ) : (
                      <Icon
                        icon='mynaui:send-solid'
                        className={`text-2xl duration-300 ${!isFormValid ? 'text-white/50' : 'text-white group-hover:text-secondary'}`}
                      />
                    )}
                  </button>
                </div>
              </form>

              {showThanks && (
                <div className='mt-6 text-center animate-bounce'>
                  <span className='bg-green-500 text-white px-6 py-2 rounded-full text-sm font-bold'>
                    Успешно отправлено! Спасибо.
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default ContactForm