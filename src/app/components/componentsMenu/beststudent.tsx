'use client'

import React from 'react'
import Image from 'next/image'
import { Icon } from '@iconify/react'

interface BestStudentsProps {
  data?: any;
}

const BestStudents: React.FC<BestStudentsProps> = ({ data }) => {
  const students = Array.isArray(data) ? data : [];

  if (students.length === 0) return null;

  return (
    <section className='py-12 bg-transparent' id='best-students'>
      <div className='container mx-auto px-4'>
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8'>
          {students.map((item: any, i: number) => (
            <div 
              key={i} 
              className='group relative p-6 pt-10 text-center rounded-[2.5rem] bg-white border border-gray-100 shadow-sm hover:shadow-2xl transition-all duration-500'
            >
              {/* МЕСТО НА ОЛИМПИАДЕ (Place) — выводим сверху слева как медаль */}
              {item.place && (
                <div className="absolute top-6 left-6 z-10 flex items-center gap-1 bg-secondary text-white px-3 py-1 rounded-lg shadow-lg rotate-[-5deg] group-hover:rotate-0 transition-transform">
                  <Icon icon="solar:cup-bold" className="text-sm" />
                  <span className="text-[10px] font-black uppercase tracking-tighter">
                    {item.place}
                  </span>
                </div>
              )}

              {/* Звезда (isStar) — сверху справа */}
              {item.isStar && (
                <div className="absolute top-6 right-6 text-yellow-400 animate-pulse">
                  <Icon icon="solar:star-bold" width={28} />
                </div>
              )}

              {/* Фото ученика */}
              <div className='relative mb-6 inline-block'>
                <div className="relative w-32 h-32 md:w-36 md:h-36 mx-auto rounded-full overflow-hidden border-4 border-gray-50 group-hover:border-primary/20 transition-all duration-500 shadow-inner">
                  <Image
                    src={item.photo || '/images/mentor/placeholder.webp'}
                    alt={item.fullName}
                    fill
                    className='object-cover transition-transform duration-700 group-hover:scale-110'
                  />
                </div>
                
                {/* Возраст */}
                <div className='absolute -right-2 bottom-2 bg-white text-midnight_text text-[10px] font-bold px-2.5 py-1 rounded-full shadow-md border border-gray-100'>
                  {item.age} жаш
                </div>
              </div>

              {/* Инфо */}
              <div className="space-y-3">
                <div>
                  <h4 className="text-xl font-bold text-midnight_text leading-tight">
                    {item.fullName}
                  </h4>
                  <p className="text-primary font-bold text-[12px] uppercase mt-1">
                    {item.subject}
                  </p>
                </div>
                
                <div className="flex justify-center">
                  <span className="text-[10px] font-black bg-gray-50 text-gray-400 px-4 py-1.5 rounded-xl uppercase border border-gray-100">
                    {item.grade}-классдын окуучусу
                  </span>
                </div>

                {/* Олимпиады (Achievements) */}
                {item.olympiad && (
                  <div className="pt-4 mt-4 border-t border-dashed border-gray-100">
                    <div className="flex flex-wrap justify-center gap-1.5">
                      {item.olympiad.split('\\').map((olymp: string, idx: number) => (
                        <span key={idx} className="text-[9px] font-bold text-gray-500 bg-gray-50 px-2 py-1 rounded-md group-hover:bg-primary/5 group-hover:text-primary transition-colors">
                          {olymp}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default BestStudents;