'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { Icon } from '@iconify/react'

interface BestStudentsProps {
  data?: any;
  title?: string;
}

const BestStudents: React.FC<BestStudentsProps> = ({ data, title }) => {
  const students = Array.isArray(data) ? data : [];
  const [search, setSearch] = useState('');

  if (students.length === 0) return null;

  const q = search.trim().toLowerCase();
  const filtered = q
    ? students.filter((s: any) =>
        (s.fullName || '').toLowerCase().includes(q) ||
        (s.subject || '').toLowerCase().includes(q) ||
        String(s.grade || '').toLowerCase().includes(q) ||
        (s.olympiad || '').toLowerCase().includes(q)
      )
    : students;

  return (
    <section className='py-12 bg-transparent' id='best-students'>
      <div className='container mx-auto px-4'>
        {/* Header row: title + search */}
        <div className='flex flex-col sm:flex-row sm:items-center gap-4 mb-8'>
          {title && (
            <h2 className='text-2xl md:text-3xl lg:text-4xl font-bold text-midnight_text shrink-0'>
              {title}
            </h2>
          )}
          <div className={`relative ${title ? 'sm:ml-auto sm:w-72' : 'max-w-sm'} w-full`}>
          <div className='absolute inset-y-0 left-4 flex items-center pointer-events-none'>
            <Icon icon='solar:magnifer-bold' className='text-gray-400' width={16} />
          </div>
          <input
            type='text'
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder='Поиск по имени, предмету или классу...'
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
        ) : (
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8'>
          {filtered.map((item: any, i: number) => (
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
                    alt={item.fullName || 'Ученик'}
                    fill
                    className='object-cover transition-transform duration-700 group-hover:scale-110'
                  />
                </div>
                
                {/* Возраст */}
                <div className='absolute -right-2 bottom-2 bg-white text-midnight_text text-[10px] font-bold px-2.5 py-1 rounded-full shadow-md border border-gray-100'>
                  {item.age} лет
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
                    Ученик {item.grade} класса
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
        )}
      </div>
    </section>
  )
}

export default BestStudents;