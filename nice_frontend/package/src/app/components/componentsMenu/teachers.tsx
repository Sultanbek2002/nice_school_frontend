'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link' // Импортируем Link

interface MentorProps {
  data?: any; 
}

const Mentor: React.FC<MentorProps> = ({ data }) => {
  const mentors = Array.isArray(data) ? data : [];

  if (mentors.length === 0) return null;

  return (
    <section className='py-12 bg-transparent' id='mentor'>
      <div className='container mx-auto px-4'>
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8'>
          {mentors.map((item: any, i: number) => {
            // Создаем slug из имени для красивой ссылки (например, "sultanbek-abdykadyrov")
            const teacherSlug = encodeURIComponent(item.fullName.toLowerCase().replace(/\s+/g, '-'));
            const detailUrl = `/mentors/${teacherSlug}`;

            return (
              <div key={i} className='group relative flex flex-col rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden'>
                
                {/* Ссылка на фото */}
                <Link href={detailUrl} className='relative w-full h-[280px] md:h-[320px] overflow-hidden block'>
                  <Image
                    src={item.photo || '/images/mentor/placeholder.webp'}
                    alt={item.fullName}
                    fill
                    className='object-cover transition-transform duration-700 group-hover:scale-105'
                  />
                </Link>

                <div className="p-5 flex flex-col flex-grow">
                  <div className="mb-3">
                    {/* Ссылка на имени */}
                    <Link href={detailUrl}>
                      <h4 className="text-xl font-bold text-midnight_text hover:text-primary transition-colors duration-300 cursor-pointer">
                        {item.fullName}
                      </h4>
                    </Link>
                    <p className='text-sm font-semibold text-primary uppercase tracking-wide mt-1'>
                      {item.subject}
                    </p>
                  </div>

                  <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
                     <span className="text-[12px] font-bold text-gray-400">
                       СТАЖ: {item.experience} ЖЫЛ
                     </span>
                     {/* Кнопка Кененирээк теперь тоже ссылка */}
                     <Link href={detailUrl} className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center group-hover:bg-primary transition-colors duration-300 shadow-sm">
                        <span className="text-primary group-hover:text-white font-bold">→</span>
                     </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  )
}

export default Mentor;