'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Icon } from '@iconify/react'
import Slider from 'react-slick'
import 'slick-carousel/slick/slick.css'
import 'slick-carousel/slick/slick-theme.css'

interface MentorProps {
  teachers?: any[];
}

const Mentor: React.FC<MentorProps> = ({ teachers = [] }) => {
  const [search, setSearch] = useState('');

  if (!teachers || teachers.length === 0) return null;

  const q = search.trim().toLowerCase();
  const filtered = q
    ? teachers.filter((t: any) =>
        (t.fullName || '').toLowerCase().includes(q) ||
        (t.subject || '').toLowerCase().includes(q) ||
        String(t.experience || '').toLowerCase().includes(q)
      )
    : teachers;

  const sliderSettings = {
    dots: true,
    infinite: filtered.length > 3,
    slidesToShow: 3,
    slidesToScroll: 1,
    arrows: false,
    autoplay: !q,
    autoplaySpeed: 3500,
    speed: 600,
    cssEase: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    responsive: [
      { breakpoint: 1200, settings: { slidesToShow: 3 } },
      { breakpoint: 1000, settings: { slidesToShow: 2 } },
      { breakpoint: 530,  settings: { slidesToShow: 1 } },
    ],
  };

  const TeacherCard = ({ item }: { item: any }) => {
    const teacherSlug = encodeURIComponent(
      (item.fullName || '').toLowerCase().trim().replace(/\s+/g, '-')
    );
    const detailUrl = `/mentors/${teacherSlug}`;
    return (
      <div className='py-14 mt-10 text-center rounded-2xl glass-card group transition-all duration-300 hover:-translate-y-2'>
        <div className='relative mb-10'>
          <Link href={detailUrl} className="block relative mx-auto w-[206px] h-[206px]">
            <Image
              src={item.photo || '/images/mentor/placeholder.webp'}
              alt={item.fullName}
              fill
              sizes="200px"
              className='inline-block rounded-full border border-black/10 object-cover transition-transform duration-500 group-hover:scale-105'
            />
          </Link>
          <div className='absolute right-[22%] -bottom-[2%] glass-card rounded-full p-4'>
            <Image src={'/images/mentor/linkedin.svg'} alt='linkedin-image' width={25} height={24} />
          </div>
        </div>
        <div>
          <Link href={detailUrl}>
            <h6 className="hover:text-primary transition-colors cursor-pointer px-4 line-clamp-1">
              {item.fullName}
            </h6>
          </Link>
          <p className='text-lg font-normal text-black/50 pt-2 uppercase text-sm tracking-wider'>
            {item.subject}
          </p>
          {item.experience && (
            <p className='text-xs font-bold text-gray-300 mt-2'>
              СТАЖ: {item.experience} ЖЫЛ
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <section className='pt-14 pb-20 scroll-mt-12' id='mentor'>
      <div className='container relative mx-auto px-4'>
        <div className='flex flex-col sm:flex-row sm:items-end gap-4 mb-10'>
          <h2 className='text-midnight_text max-w-96 leading-12 lg:leading-14'>
            Наши учителя
          </h2>
          {/* Search */}
          <div className='relative sm:ml-auto sm:w-72'>
            <div className='absolute inset-y-0 left-4 flex items-center pointer-events-none'>
              <Icon icon='solar:magnifer-bold' className='text-gray-400' width={16} />
            </div>
            <input
              type='text'
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder='Поиск по имени или предмету...'
              className='w-full pl-10 pr-9 py-2.5 rounded-2xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-gray-300 shadow-sm'
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className='absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors'
              >
                <Icon icon='solar:close-circle-bold' width={16} />
              </button>
            )}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className='text-center py-14'>
            <div className='text-5xl mb-3'>🔍</div>
            <p className='text-gray-400 font-bold'>Ничего не найдено по запросу «{search}»</p>
          </div>
        ) : q ? (
          /* Grid layout when searching */
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
            {filtered.map((item: any, i: number) => (
              <TeacherCard key={i} item={item} />
            ))}
          </div>
        ) : (
          /* Slider when not searching */
          <Slider {...sliderSettings} className="mentor-slider">
            {filtered.map((item: any, i: number) => (
              <div key={i}>
                <TeacherCard item={item} />
              </div>
            ))}
          </Slider>
        )}
      </div>

      <style jsx global>{`
        .mentor-slider .slick-dots { bottom: -36px; }
        .mentor-slider .slick-dots li button:before { color: #17a589; font-size: 10px; opacity: 0.35; }
        .mentor-slider .slick-dots li.slick-active button:before { color: #17a589; opacity: 1; }
        .mentor-slider .slick-dots li button:hover:before { opacity: 0.7; }
      `}</style>
    </section>
  )
}

export default Mentor;
