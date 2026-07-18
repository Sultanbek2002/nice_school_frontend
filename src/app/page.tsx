import React from "react";
import Hero from "@/app/components/Home/Hero";
import Companies from "@/app/components/Home/Companies";
import Courses from "@/app/components/Home/Courses";
import Mentor from "@/app/components/Home/Mentor";
import Testimonial from "@/app/components/Home/Testimonials";
import ContactForm from "@/app/components/ContactForm";
import SchoolMap from "@/app/components/SchoolMap";
import Newsletter from "@/app/components/Home/Newsletter";
import Stats from "@/app/components/Home/Stats";
import { getSiteStructure } from '@/utils/apiData';

import { Metadata } from "next";
import OlympiadComponent from "./components/componentsMenu/olympiad";

export const metadata: Metadata = {
  title: "Nice school",
  icons: {
    icon: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTe6TIfD1x8ZfFg-S85x-0yDZDLrnFOFCbcSA&s', // путь относительно папки public
    shortcut: '/shortcut-static-icon.png',
    apple: '/apple-touch-icon.png', // для iPhone
    other: {
      rel: 'apple-touch-icon-precomposed',
      url: '/apple-touch-icon-precomposed.png',
    },
  },
};


export default async function Home() {
  const data = await getSiteStructure();
  const allTeachers: any[] = [];
  const allCourses: any[] = [];

  // Проходим по всей структуре сайта
  data.structure.forEach((menuItem: any) => {
    menuItem.blocks.forEach((block: any) => {
      // 1. Собираем учителей
      if (block.type === 'teachers_grid' && block.content) {
        try {
          const teachers = JSON.parse(block.content);
          if (Array.isArray(teachers)) allTeachers.push(...teachers);
        } catch (e) { console.error("Ошибка парсинга учителей", e); }
      }

      // 2. Собираем курсы
      if (block.type === 'courses_grid' && block.content) {
        try {
          const courses = JSON.parse(block.content);
          if (Array.isArray(courses)) allCourses.push(...courses);
        } catch (e) { console.error("Ошибка парсинга курсов", e); }
      }
    });
  });

  // Берем по 10 штук для главной
  const topTenTeachers = allTeachers.slice(0, 10);
  const topTenCourses = allCourses.slice(0, 10);
  
  // Если баннер активен, показываем его
  return (
    <main>
      <Hero bannerData={data.banner} courses={allCourses} contactData={data.school_info} />
      <OlympiadComponent data={data.olympiads}/>
      <Companies />
      <Courses courses={topTenCourses} />
      <Stats />
      <Mentor  teachers={topTenTeachers}/>
      <Testimonial />
      <ContactForm/>
      <SchoolMap />
    </main>
  );
}