import { CourseType } from '@/app/types/course'
import { FooterLinkType } from '@/app/types/footerlink'
import { MentorType } from '@/app/types/mentor'
import { HeaderType } from '@/app/types/menu'
import { TestimonialType } from '@/app/types/testimonial'
import { NextResponse } from 'next/server'

// Оставляем эти данные как есть (статичными)
const TechGaintsData: { imgSrc: string }[] = [
  { imgSrc: '/images/companies/airbnb.svg' },
  { imgSrc: '/images/companies/fedex.svg' },
  { imgSrc: '/images/companies/google.svg' },
  { imgSrc: '/images/companies/hubspot.svg' },
  { imgSrc: '/images/companies/microsoft.svg' },
  { imgSrc: '/images/companies/walmart.svg' },
  { imgSrc: '/images/companies/airbnb.svg' },
  { imgSrc: '/images/companies/fedex.svg' },
]

const CourseData: CourseType[] = [
  {
    heading: '(MERN) Full-Stack Development',
    name: 'James Nolan',
    imgSrc: '/images/courses/mern.webp',
    students: 150,
    classes: 12,
    price: 20,
    rating: 4.4,
  },
  {
    heading: 'Design Systems with React',
    name: 'Elena Brooks',
    imgSrc: '/images/courses/react.webp',
    students: 130,
    classes: 12,
    price: 20,
    rating: 4.5,
  },
  {
    heading: 'Create Stunning Banners in Figma',
    name: 'Aria Kim',
    imgSrc: '/images/courses/UiUx.webp',
    students: 120,
    classes: 12,
    price: 20,
    rating: 5.0,
  },
  {
    heading: 'Build & Launch a Webflow Website',
    name: 'Marcus Lee',
    imgSrc: '/images/courses/webflow.webp',
    students: 150,
    classes: 12,
    price: 20,
    rating: 5.0,
  },
]

const MentorData: MentorType[] = [
  {
    profession: 'Senior UX Designer',
    name: 'Shoo Thar Mien',
    imgSrc: '/images/mentor/user1.webp',
  },
  {
    profession: 'Product Design Lead',
    name: 'Lina Carter',
    imgSrc: '/images/mentor/user2.webp',
  },
  {
    profession: 'UI/UX Strategy Consultant',
    name: 'Ethan Nakamura',
    imgSrc: '/images/mentor/user3.webp',
  },
]

const TestimonialData: TestimonialType[] = [
  {
    name: 'Michelle Bennett',
    profession: 'CEO, Parkview International Ltd',
    comment: 'The courses transformed my career!',
    imgSrc: '/images/testimonial/user1.webp',
    rating: 5,
  },
  {
    name: 'Leslie Alexander',
    profession: 'Founder, TechWave Solutions',
    comment: 'Engaging content and flexible learning schedules.',
    imgSrc: '/images/testimonial/user2.webp',
    rating: 5,
  },
  {
    name: 'Cody Fisher',
    profession: 'Product Manager, InnovateX',
    comment: 'Highly recommend!',
    imgSrc: '/images/testimonial/user3.webp',
    rating: 5,
  },
]

const FooterLinkData: FooterLinkType[] = [
  {
    section: 'Sitemap',
    links: [
      { label: 'Home', href: '/' },
      { label: 'Courses', href: '/#courses' },
      { label: 'Mentor', href: '/#mentor' },
      { label: 'Contact Us', href: '/#contact' },
    ],
  },
]

// ГЛАВНОЕ ИЗМЕНЕНИЕ ЗДЕСЬ
export const GET = async () => {
  try {
    // Делаем запрос к твоему Go бэкенду
    const response = await fetch('http://localhost:8080/api/menu', {
      cache: 'no-store' 
    });

    if (!response.ok) throw new Error('Бэкенд не отвечает');

    const goData = await response.json();
    

    // Маппим данные из Go (Name, Link) в формат HeaderType (label, href)
    const HeaderData: HeaderType[] = goData.map((item: any) => ({
      label: item.name,
      href: item.link
    }));

    return NextResponse.json({
      HeaderData, // Эти данные теперь из базы через Go
      TechGaintsData,
      CourseData,
      MentorData,
      TestimonialData,
      FooterLinkData,
    })
  } catch (error) {
    console.error("Ошибка получения меню:", error);
    
    // Если бэкенд упал, возвращаем пустой массив для меню, чтобы сайт не сломался
    return NextResponse.json({
      HeaderData: [], 
      TechGaintsData,
      CourseData,
      MentorData,
      TestimonialData,
      FooterLinkData,
    })
  }
}