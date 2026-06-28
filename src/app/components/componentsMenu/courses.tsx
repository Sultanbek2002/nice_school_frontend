'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Icon } from '@iconify/react'

interface CoursesProps {
    data?: any;
}

const CourseComponent: React.FC<CoursesProps> = ({ data }) => {
    // 1. Проверяем данные
    const courses = Array.isArray(data) ? data : [];

    if (courses.length === 0) return null;

    return (
        <section id='courses' className='scroll-mt-12 py-16 bg-transparent'>
            <div className='container mx-auto px-4'>
                {/* Заголовок секции (можно вернуть, если нужно) */}

                {/* СЕТКА КУРСОВ */}
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8'>
                    {courses.map((item: any, i: number) => {
                        // 2. Генерируем slug внутри map для каждого курса отдельно
                        const courseSlug = encodeURIComponent(
                            item.title.toLowerCase().trim().replace(/\s+/g, '-')
                        );
                        const detailUrl = `/courses/${courseSlug}`;
                        

                        return (
                            <div
                                key={i}
                                className='group bg-white shadow-sm hover:shadow-2xl rounded-[2rem] overflow-hidden border border-gray-100 transition-all duration-500 flex flex-col h-full'
                            >
                                {/* Изображение курса с маленьким отступом */}
                                <div className='p-2 pb-0'>
                                    <div className='relative h-56 w-full rounded-[2rem] overflow-hidden shadow-inner'>
                                        <Image
                                            src={item.mainImage || '/images/courses/placeholder.png'}
                                            alt={item.title}
                                            fill
                                            className='object-cover transition-transform duration-700 group-hover:scale-110'
                                        />

                                        <div className='absolute bottom-3 left-3 bg-white/80 backdrop-blur-md px-3 py-1 rounded-xl shadow-sm'>
                                            <p className='text-midnight_text text-[10px] font-bold uppercase tracking-tight'>
                                                {item.targetAud} жаш +
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className='p-6 flex flex-col flex-grow'>
                                    <div className="mb-6">
                                        <h4 className='text-2xl font-bold text-midnight_text group-hover:text-primary transition-colors line-clamp-1'>
                                            {item.title}
                                        </h4>
                                        <p className='text-sm text-gray-500 mt-3 line-clamp-2 leading-relaxed'>
                                            {item.description}
                                        </p>
                                    </div>

                                    <div className='mt-auto space-y-4'>
                                        <div className='flex items-center justify-between py-4 border-t border-gray-50'>
                                            <div className='flex items-center gap-2'>
                                                <Icon icon='solar:clock-circle-bold' className='text-primary text-2xl' />
                                                <span className='text-sm font-bold text-midnight_text uppercase tracking-tight'>
                                                    {item.duration} ай окутуу
                                                </span>
                                            </div>
                                            {item.isPublic && (
                                                <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                                            )}
                                        </div>

                                        <div className='flex items-center gap-3 bg-gray-50 p-3 rounded-2xl'>
                                            <Icon
                                                icon='solar:star-fall-minimalistic-bold'
                                                className='text-primary text-xl flex-shrink-0'
                                            />
                                            <p className='text-[11px] font-bold text-gray-400 uppercase leading-none truncate'>
                                                {item.skills || "Жалпы билим берүү"}
                                            </p>
                                        </div>
                                    </div>

                                    <Link
                                        href={detailUrl}
                                        className="mt-6 w-full py-4 bg-white border-2 border-primary text-primary font-bold rounded-2xl text-center group-hover:bg-primary group-hover:text-white transition-all duration-300 block"
                                    >
                                        Толук маалымат
                                    </Link>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}

export default CourseComponent;