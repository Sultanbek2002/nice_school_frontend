import React from "react";
import { getSiteStructure, ApiResponse } from '@/utils/apiData';
import TextBlock from "@/app/components/componentsMenu/text";
import Carousel from "@/app/components/componentsMenu/carousel";
import Teachers from "@/app/components/componentsMenu/teachers";
import CourseComponent from "../components/componentsMenu/courses";
import Subtitle from "../components/componentsMenu/subheader";
import BestStudents from "../components/componentsMenu/beststudent";
import NewsGrid from "../components/componentsMenu/newsgrid";
import PhotoGallery from "../components/componentsMenu/photogallery";
import EventsGrid from "../components/componentsMenu/eventsgrid";

const COMPONENTS_MAP: Record<string, React.FC<any>> = {
  text: TextBlock,
  courses_grid: CourseComponent,
  slider: Carousel,
  teachers_grid: Teachers,
  subtitle: Subtitle,
  best_students: BestStudents,
  news_grid: NewsGrid,
  photo_gallery: PhotoGallery,
  events_grid: EventsGrid,
};

export default async function DynamicPage({ params }: { params: Promise<{ slug: string }> }) {
  // 1. Получаем объект ответа
  const response: ApiResponse = await getSiteStructure();
  const { slug } = await params;
  const currentPath = `/${slug}`;
  
  // 2. Ищем страницу внутри массива response.structure
  // .trim() — в БД встречаются меню с пробелами в конце link (опечатка при создании),
  // из-за чего страница не находилась даже при видимо совпадающем URL
  const currentPage = response.structure.find(page => page.link?.trim() === currentPath);

  if (!currentPage) {
    return (
      <div className="pt-40 text-center min-h-screen">
        <h2 className="text-2xl font-bold text-midnight_text">Баракча табылган жок</h2>
      </div>
    );
  }

  return (
    <main className="min-h-screen pt-20 lg:pt-28 pb-10">
      <div className="container mx-auto px-4 mb-8">
        {/* Заголовок страницы */}
        <h1 className="text-3xl md:text-4xl font-bold text-dark">
          {currentPage.name}
        </h1>
        <div className="w-20 h-1 bg-primary mt-2 rounded-full mb-10"></div>
      
        {/* Рендерим блоки */}
        <div className="flex flex-col gap-y-16">
          {(() => {
            const sorted = [...(currentPage.blocks || [])].sort((a: any, b: any) => a.position - b.position);
            const skip = new Set<number>();
            const titleFor: Record<number, string> = {};

            // Если subtitle идёт прямо перед teachers_grid или best_students — объединяем
            const ABSORB_TYPES = new Set(['teachers_grid', 'best_students', 'courses_grid']);
            sorted.forEach((block: any, idx: number) => {
              if (block.type === 'subtitle' && idx + 1 < sorted.length) {
                const next = sorted[idx + 1];
                if (ABSORB_TYPES.has(next.type)) {
                  skip.add(block.ID);
                  try {
                    titleFor[next.ID] = JSON.parse(block.content || '""').replace(/^"|"$/g, '');
                  } catch {
                    titleFor[next.ID] = (block.content || '').replace(/^"|"$/g, '');
                  }
                }
              }
            });

            return sorted.map((block: any) => {
              if (skip.has(block.ID)) return null;
              const Component = COMPONENTS_MAP[block.type];
              if (!Component) return null;
              let blockData: any;
              try {
                blockData = JSON.parse(block.content || "{}");
              } catch {
                blockData = block.content;
              }
              const extraProps = titleFor[block.ID] ? { title: titleFor[block.ID] } : {};
              return <Component key={block.ID} data={blockData} {...extraProps} />;
            });
          })()}
        </div>
      </div>
    </main>
  );
}