import React from "react";
import Image from "next/image";
import { ApiResponse, getSiteStructure } from "@/utils/apiData";
import { RelatedTeacherCard, RelatedSectionBlock } from "@/app/components/RelatedSection";

export default async function TeacherDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const response = await getSiteStructure();

  // 1. Ищем учителей во всех блоках всех страниц
  let allTeachers: any[] = [];
  response.structure.forEach((page: any) => {
    page.blocks?.forEach((block: any) => {
      if (block.type === 'teachers_grid') {
        try {
          const parsed = JSON.parse(block.content || "[]");
          if (Array.isArray(parsed)) allTeachers = [...allTeachers, ...parsed];
          else if (parsed && typeof parsed === 'object') allTeachers.push(parsed);
        } catch {}
      }
    });
  });

  // 2. Находим нужного учителя по slug
  const teacher = allTeachers.find(t =>
    encodeURIComponent(t.fullName.toLowerCase().replace(/\s+/g, '-')) === slug
  );
  const otherTeachers = allTeachers.filter(t => encodeURIComponent(t.fullName.toLowerCase().replace(/\s+/g, '-')) !== slug).slice(0, 4);

  if (!teacher) {
    return <div className="pt-40 text-center">Учитель не найден</div>;
  }

  return (
    <main className="min-h-screen pt-32 pb-20">
      <div className="container mx-auto px-4">
        <div className="glass-card rounded-3xl p-6 md:p-12 flex flex-col md:flex-row gap-12">
          
          {/* Левая колонка: Фото */}
          <div className="w-full md:w-1/3">
            <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden shadow-lg">
              <Image 
                src={teacher.photo} 
                alt={teacher.fullName} 
                fill 
                className="object-cover"
              />
            </div>
          </div>

          {/* Правая колонка: Инфо */}
          <div className="w-full md:w-2/3 space-y-6">
            <div>
              <h1 className="text-4xl font-bold text-midnight_text">{teacher.fullName}</h1>
              <p className="text-xl text-primary font-semibold mt-2">{teacher.subject}</p>
            </div>

            <div className="flex gap-4">
              <div className="bg-primary/5 px-4 py-2 rounded-xl">
                <span className="block text-xs text-gray-500 uppercase font-bold">Опыт</span>
                <span className="text-lg font-bold">{teacher.experience} лет</span>
              </div>
              <div className="bg-primary/5 px-4 py-2 rounded-xl">
                <span className="block text-xs text-gray-500 uppercase font-bold">Возраст</span>
                <span className="text-lg font-bold">{teacher.age} лет</span>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-3 text-midnight_text">Биография</h3>
              <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                {teacher.bio || "Нет информации"}
              </p>
            </div>

            {/* Блок сертификатов */}
            {teacher.certificates && teacher.certificates.length > 0 && (
              <div className="pt-6 border-t border-gray-100">
                <h3 className="text-xl font-bold mb-4 text-midnight_text">Сертификаты</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {teacher.certificates.map((cert: string, idx: number) => (
                    <div key={idx} className="relative aspect-video rounded-lg overflow-hidden border border-gray-200 hover:scale-105 transition-transform cursor-zoom-in">
                      <Image src={cert} alt="certificate" fill className="object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        {/* ── RELATED ── */}
        {otherTeachers.length > 0 && (
          <RelatedSectionBlock title="Другие учителя">
            {otherTeachers.map((t, i) => <RelatedTeacherCard key={i} teacher={t} />)}
          </RelatedSectionBlock>
        )}
      </div>
    </main>
  );
}