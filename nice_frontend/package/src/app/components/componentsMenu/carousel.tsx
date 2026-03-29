'use client'

import React from 'react'
import Image from 'next/image'
import Slider from 'react-slick'
import 'slick-carousel/slick/slick.css'
import 'slick-carousel/slick/slick-theme.css'

interface SliderProps {
    data?: any; // Данные из базы
}

const Carousel: React.FC<SliderProps> = ({ data }) => {
    // 1. Проверяем данные: если это массив (из базы), используем его. 
    // Если данных нет, возвращаем null или пустой слайдер.
    const slides = Array.isArray(data) ? data : [];

    const settings = {
        dots: false,
        infinite: slides.length > 4, // Бесконечно, если слайдов больше, чем показываем
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
                    slidesToShow: 3,
                },
            },
            {
                breakpoint: 700,
                settings: {
                    slidesToShow: 2,
                },
            },
            {
                breakpoint: 500,
                settings: {
                    slidesToShow: 1,
                },
            },
        ],
    }

    if (slides.length === 0) return null;

    return (
        <section className='text-center py-10 overflow-hidden'>
            <div className='container mx-auto px-4'>
                <h6 className='text-midnight_text capitalize mb-5 opacity-60'>
                    Биздин өнөктөштөр жана жетишкендиктер
                </h6>
                <div className='py-7 border-b border-t border-gray-100'>
                    <Slider {...settings}>
                        {slides.map((item: any, i: number) => (
                            <div key={i} className="px-4 outline-none">
                                <div className="flex flex-col items-center justify-center gap-2">
                                    <div className="relative w-[100px] h-[100px] rounded-full border-2 border-gray-100 p-2 overflow-hidden bg-white shadow-inner">
                                        <Image
                                            src={item.url}
                                            alt={item.title || "slide"}
                                            fill
                                            // 2. Класс 'object-cover' критичен: он заставляет картинку 
                                            //    полностью заполнить круг, не деформируясь.
                                            className='rounded-full object-cover filter grayscale hover:grayscale-0 transition-all duration-300'
                                        />
                                    </div>
                                    {/* Если хочешь выводить подпись из базы */}
                                    {item.title && (
                                        <p className="text-xs text-gray-400 mt-2">{item.title}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </Slider>
                </div>
            </div>
        </section>
    )
}

export default Carousel