import React from "react";
import { getSiteStructure, ApiResponse } from '@/utils/apiData';
import TextBlock from "@/app/components/componentsMenu/text";
import Carousel from "@/app/components/componentsMenu/carousel";
import Teachers from "@/app/components/componentsMenu/teachers";
import CourseComponent from "../components/componentsMenu/courses";
import Subtitle from "../components/componentsMenu/subheader";
import BestStudents from "../components/componentsMenu/beststudent";

// Карта компонентов для динамических страницa
const COMPONENTS_MAP: Record<string, React.FC<any>> = {
  text: TextBlock,
  courses_grid: CourseComponent,
  slider: Carousel,
  teachers_grid: Teachers,
  subtitle: Subtitle,
  best_students: BestStudents
};

export default async function DynamicPage({ params }: { params: { slug: string } }) {
  // 1. Получаем объект ответа
  const response: ApiResponse = await getSiteStructure();
  
  const currentPath = `/${params.slug}`;
  
  // 2. Ищем страницу внутри массива response.structure
  const currentPage = response.structure.find(page => page.link === currentPath);

  if (!currentPage) {
    return (
      <div className="pt-40 text-center min-h-screen">
        <h2 className="text-2xl font-bold text-midnight_text">Баракча табылган жок</h2>
      </div>
    );
  }

  return (
    <main className="min-h-screen pt-20 lg:pt-28 pb-10 bg-slate-gray"> 
      <div className="container mx-auto px-4 mb-8">
        {/* Заголовок страницы */}
        <h1 className="text-3xl md:text-4xl font-bold text-dark">
          {currentPage.name}
        </h1>
        <div className="w-20 h-1 bg-primary mt-2 rounded-full mb-10"></div>
      
        {/* Рендерим блоки */}
        <div className="flex flex-col gap-y-16"> 
          {currentPage.blocks
            ?.sort((a: any, b: any) => a.position - b.position) // Сортируем блоки по позиции
            .map((block: any) => {
              const Component = COMPONENTS_MAP[block.type];
              if (!Component) return null;

              let blockData: any;
              try {
                // Пытаемся распарсить JSON
                blockData = JSON.parse(block.content || "{}");
              } catch (e) {
                // Если это не JSON (например, строка в subtitle), берем как есть
                blockData = block.content;
              }

              return <Component key={block.ID} data={blockData} />;
          })}
        </div>
      </div>
    </main>
  );
}