import { CourseType } from '@/app/types/course'
import { FooterLinkType } from '@/app/types/footerlink'
import { MentorType } from '@/app/types/mentor'
import { HeaderType } from '@/app/types/menu'
import { TestimonialType } from '@/app/types/testimonial'
import { NextResponse } from 'next/server'
import { GO_API_URL } from '@/utils/apiData';

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

// Раньше здесь был захардкоженный массив демо-отзывов — теперь реальные отзывы
// заводятся через админку и приходят из бэкенда (см. getTestimonials ниже).
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
  let HeaderData: HeaderType[] = [];
  let TestimonialData: TestimonialType[] = [];

  try {
    const response = await fetch(`${GO_API_URL}/api/menu`, { cache: 'no-store' });
    if (!response.ok) throw new Error('Бэкенд не отвечает');
    const goData = await response.json();

    // Маппим данные из Go (Name, Link) в формат HeaderType (label, href)
    HeaderData = goData.map((item: any) => ({
      label: item.name,
      href: item.link
    }));
  } catch (error) {
    console.error("Ошибка получения меню:", error);
    // Если бэкенд упал, отдаём пустой массив, чтобы сайт не сломался
  }

  try {
    const res = await fetch(`${GO_API_URL}/api/testimonials`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Бэкенд не отвечает');
    const data = await res.json();
    TestimonialData = (Array.isArray(data) ? data : []).map((item: any) => ({
      name: item.name,
      profession: item.profession,
      comment: item.comment,
      imgSrc: item.photo || '/images/testimonial/user1.webp',
      rating: item.rating,
    }));
  } catch (error) {
    console.error("Ошибка получения отзывов:", error);
  }

  return NextResponse.json({
    HeaderData,
    TechGaintsData,
    CourseData,
    MentorData,
    TestimonialData,
    FooterLinkData,
  })
}