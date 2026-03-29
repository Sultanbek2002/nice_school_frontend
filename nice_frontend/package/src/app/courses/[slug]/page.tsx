import React from "react";
import Image from "next/image";
import { Icon } from "@iconify/react/dist/iconify.js";
import { getSiteStructure,ApiResponse } from "@/utils/apiData";

export default async function CourseDetailPage({ params }: { params: { slug: string } }) {
  const response: ApiResponse = await getSiteStructure();
  
  // 1. Собираем все курсы из всех блоков структуры сайта
  let allCourses: any[] = [];
  response.structure.forEach((page: any) => {
    page.blocks?.forEach((block: any) => {
      if (block.type === 'courses_grid') {
        const parsed = JSON.parse(block.content || "[]");
        allCourses = [...allCourses, ...parsed];
      }
    });
  });

  // 2. Находим курс по slug (переводим название в url-формат)
  const course = allCourses.find(c => 
    encodeURIComponent(c.title.toLowerCase().replace(/\s+/g, '-')) === params.slug
  );

  if (!course) {
    return <div className="pt-40 text-center text-2xl font-bold">Курс табылган жок</div>;
  }

  return (
    <main className="min-h-screen pt-28 pb-20 bg-white">
      <div className="container mx-auto px-4">
        
        {/* ВЕРХНЯЯ ЧАСТЬ: Шапка курса */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
          <div className="relative aspect-video rounded-[2.5rem] overflow-hidden shadow-2xl border-8 border-gray-50">
            <Image 
              src={course.mainImage} 
              alt={course.title} 
              fill 
              className="object-cover"
            />
          </div>

          <div className="space-y-6">
            <div className="inline-block px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-bold uppercase tracking-widest">
              {course.targetAud} жаш + | {course.duration} ай окутуу
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-midnight_text leading-tight">
              {course.title}
            </h1>
            <p className="text-xl text-gray-500 font-medium leading-relaxed">
              {course.valueProp}
            </p>
            <div className="flex items-center gap-4 pt-4">
               <button className="px-8 py-4 bg-primary text-white font-bold rounded-2xl shadow-lg hover:bg-secondary transition-all transform hover:-translate-y-1">
                 Курска жазылуу
               </button>
               <div className="flex -space-x-3">
                  {/* Имитация аватарок студентов */}
                  {[1,2,3].map(i => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-gray-200 overflow-hidden">
                       <Image src={`https://i.pravatar.cc/100?img=${i+10}`} alt="user" width={40} height={40} />
                    </div>
                  ))}
                  <div className="pl-5 text-sm font-bold text-gray-400">+120 студент</div>
               </div>
            </div>
          </div>
        </div>

        {/* СРЕДНЯЯ ЧАСТЬ: Описание и Навыки */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 border-t border-gray-100 pt-16">
          <div className="lg:col-span-2 space-y-8">
            <div>
              <h3 className="text-2xl font-bold text-midnight_text mb-4">Курс жөнүндө маалымат</h3>
              <p className="text-gray-600 text-lg leading-relaxed whitespace-pre-line">
                {course.description}
              </p>
            </div>

            {/* ГАЛЕРЕЯ (из поля gallery в JSON) */}
            {course.gallery && course.gallery.length > 0 && (
              <div>
                <h3 className="text-2xl font-bold text-midnight_text mb-6">Окуу процессинен сүрөттөр</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {course.gallery.map((img: string, idx: number) => (
                    <div key={idx} className="relative aspect-square rounded-3xl overflow-hidden cursor-zoom-in hover:opacity-90 transition-opacity shadow-sm">
                      <Image src={img} alt="gallery" fill className="object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Боковая панель: Что изучим */}
          <div className="bg-gray-50 rounded-[2rem] p-8 h-fit">
            <h4 className="text-xl font-bold text-midnight_text mb-6 flex items-center gap-2">
              <Icon icon="solar:shield-check-bold" className="text-primary text-2xl" />
              Эмнелерди үйрөнөсүз?
            </h4>
            <div className="space-y-4">
              {course.skills.split('\\').map((skill: string, idx: number) => (
                <div key={idx} className="flex items-center gap-3 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                  <span className="font-bold text-midnight_text text-sm uppercase">{skill}</span>
                </div>
              ))}
            </div>
            
            <div className="mt-8 p-6 bg-primary rounded-2xl text-white text-center">
               <p className="text-xs font-bold opacity-80 uppercase mb-2">Сертификат</p>
               <p className="text-sm font-medium leading-tight">Курсту ийгиликтүү аяктаганда расмий сертификат берилет</p>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}