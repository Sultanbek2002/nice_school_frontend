'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import Slider from 'react-slick'
import 'slick-carousel/slick/slick.css'
import 'slick-carousel/slick/slick-theme.css'

interface MentorProps {
  teachers?: any[];
}

const Mentor: React.FC<MentorProps> = ({ teachers = [] }) => {
  if (!teachers || teachers.length === 0) return null;

  const settings = {
    dots: true,
    infinite: teachers.length > 3,
    slidesToShow: 3,
    slidesToScroll: 1,
    arrows: false,
    autoplay: true,
    autoplaySpeed: 3500,
    speed: 600,
    cssEase: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    responsive: [
      {
        breakpoint: 1200,
        settings: { slidesToShow: 3 },
      },
      {
        breakpoint: 1000,
        settings: { slidesToShow: 2 },
      },
      {
        breakpoint: 530,
        settings: { slidesToShow: 1 },
      },
    ],
  }

  return (
    <section className='pt-14 pb-20 scroll-mt-12' id='mentor'>
      <div className='container relative mx-auto px-4'>
        <h2 className='text-midnight_text max-w-96 leading-12 lg:leading-14 mb-10'>
          Наши учителя
        </h2>

        <Slider {...settings} className="mentor-slider">
          {teachers.map((item: any, i: number) => {
            const teacherSlug = encodeURIComponent(
              item.fullName.toLowerCase().trim().replace(/\s+/g, '-')
            );
            const detailUrl = `/mentors/${teacherSlug}`;

            return (
              <div key={i}>
                <div className='m-3 py-14 mt-10 text-center rounded-2xl glass-card group transition-all duration-300 hover:-translate-y-2'>
                  <div className='relative mb-10'>
                    <Link href={detailUrl} className="block relative mx-auto w-[206px] h-[206px]">
                      <Image
                        src={item.photo || '/images/mentor/placeholder.webp'}
                        alt={item.fullName}
                        fill
                        className='inline-block rounded-full border border-black/10 object-cover transition-transform duration-500 group-hover:scale-105'
                      />
                    </Link>
                    <div className='absolute right-[22%] -bottom-[2%] glass-card rounded-full p-4'>
                      <Image
                        src={'/images/mentor/linkedin.svg'}
                        alt='linkedin-image'
                        width={25}
                        height={24}
                      />
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
              </div>
            );
          })}
        </Slider>
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
