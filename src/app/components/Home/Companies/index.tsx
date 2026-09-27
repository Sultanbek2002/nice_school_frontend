'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Slider from 'react-slick'
import 'slick-carousel/slick/slick.css'
import 'slick-carousel/slick/slick-theme.css'

interface Sponsor {
  imgSrc: string
  name?: string
  website?: string
}

// CAROUSEL SETTINGS
const Companies = () => {
  const [techGaint, setTechGaint] = useState<Sponsor[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/data')
        if (!res.ok) throw new Error('Failed to fetch')
        const data = await res.json()
        setTechGaint(data.TechGaintsData)
      } catch (error) {
        console.error('Error fetching service:', error)
      }
    }
    fetchData()
  }, [])

  const settings = {
    dots: false,
    infinite: true,
    slidesToShow: 4,
    slidesToScroll: 1,
    arrows: false,
    autoplay: true,
    speed: 2000,
    autoplaySpeed: 2000,
    cssEase: 'linear',
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 4,
          slidesToScroll: 1,
          infinite: true,
          dots: false,
        },
      },
      {
        breakpoint: 700,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
          infinite: true,
          dots: false,
        },
      },
      {
        breakpoint: 500,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
          infinite: true,
          dots: false,
        },
      },
    ],
  }

  // Пока в админке не добавили ни одного спонсора — блок просто не показываем,
  // не показывать же пустую карусель
  if (techGaint.length === 0) return null

  return (
    <section className='text-center'>
      <div className='container'>
        <h6 className='text-midnight_text capitalize'>
          Наши спонсоры
        </h6>
        <div className='py-7 border-b'>
          <Slider {...settings}>
            {techGaint.map((item, i) => {
              // Рамка выше, чем шире — логотипы спонсоров часто квадратные или портретные
              // (аватарка из Instagram, эмблема банка), в узкой низкой рамке они превращались в точку
              const logo = (
                <div className='relative mx-auto' style={{ width: 90, height: 110 }}>
                  <Image
                    src={item.imgSrc}
                    alt={item.name || 'Спонсор'}
                    fill
                    sizes='90px'
                    className='object-contain'
                  />
                </div>
              )
              return (
                <div key={i}>
                  {item.website ? (
                    <a href={item.website} target='_blank' rel='noopener noreferrer' aria-label={item.name}>
                      {logo}
                    </a>
                  ) : logo}
                </div>
              )
            })}
          </Slider>
        </div>
      </div>
    </section>
  )
}

export default Companies
