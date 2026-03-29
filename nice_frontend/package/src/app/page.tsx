import React from "react";
import Hero from "@/app/components/Home/Hero";
import Companies from "@/app/components/Home/Companies";
import Courses from "@/app/components/Home/Courses";
import Mentor from "@/app/components/Home/Mentor";
import Testimonial from "@/app/components/Home/Testimonials";
import ContactForm from "@/app/components/ContactForm";
import Newsletter from "@/app/components/Home/Newsletter";
import { getSiteStructure } from '@/utils/apiData';

import { Metadata } from "next";

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
  
  // Если баннер активен, показываем его
  return (
    <main>
      <Hero  bannerData={data.banner}/>
      <Companies />
      <Courses />
      <Mentor />
      <Testimonial />
      <ContactForm/>
      <Newsletter />
    </main>
  );
}