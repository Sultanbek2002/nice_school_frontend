import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Icon } from "@iconify/react/dist/iconify.js";
import { getSiteStructure, ApiResponse, GO_API_URL, makeSlug } from "@/utils/apiData";
import { RelatedCourseCard, RelatedSectionBlock } from "@/app/components/RelatedSection";
import { pageMetadata, truncate, SITE_NAME } from "@/utils/seo";

// Заголовок и описание страницы курса для поисковиков и превью в мессенджерах
export async function generateMetadata({ params }: { params: Promise<{ slug: string; locale: string }> }): Promise<Metadata> {
  const { slug, locale } = await params;
  const t = await getTranslations({ locale, namespace: "CourseDetail" });
  try {
    const response: ApiResponse = await getSiteStructure(locale);
    let all: any[] = [];
    response.structure.forEach((page: any) => {
      page.blocks?.forEach((block: any) => {
        if (block.type === 'courses_grid') {
          try {
            const parsed = JSON.parse(block.content || "[]");
            if (Array.isArray(parsed)) all = [...all, ...parsed];
          } catch {}
        }
      });
    });
    const c = all.find(x => x?.title && (x._slug ?? makeSlug(x.title)) === slug);
    if (c) {
      const title = String(c.title).trim();
      return pageMetadata({
        title: t("metaTitle", { title }),
        description: truncate(c.description) || truncate(c.valueProp) || t("metaDescription", { title, site: SITE_NAME }),
        path: `/courses/${slug}`,
        image: c.mainImage,
        locale,
      });
    }
  } catch {}
  return pageMetadata({ title: t("metaFallback"), path: `/courses/${slug}`, noindex: true, locale });
}

export default async function CourseDetailPage({ params }: { params: Promise<{ slug: string; locale: string }> }) {
  const { slug, locale } = await params;
  const t = await getTranslations({ locale, namespace: "CourseDetail" });
  const response: ApiResponse = await getSiteStructure(locale);

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
    (c._slug ?? makeSlug(c.title)) === slug
  );
  const otherCourses = allCourses.filter(c => (c._slug ?? makeSlug(c.title)) !== slug).slice(0, 4);

  // Настоящий HTTP 404 вместо «200 + текст ошибки»
  if (!course) notFound();

  return (
    <main className="min-h-screen pt-28 pb-20">
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
              {t("badge", { age: String(course.targetAud ?? ""), months: String(course.duration ?? "") })}
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-midnight_text leading-tight">
              {course.title}
            </h1>
            <p className="text-xl text-gray-500 font-medium leading-relaxed">
              {course.valueProp}
            </p>
            <div className="flex items-center gap-4 pt-4">
               <button className="px-8 py-4 bg-primary text-white font-bold rounded-2xl shadow-lg hover:bg-secondary transition-all transform hover:-translate-y-1">
                 {t("enroll")}
               </button>
               <div className="flex -space-x-3">
                  {/* Имитация аватарок студентов */}
                  {[1,2,3].map(i => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-gray-200 overflow-hidden">
                       <Image src={`https://i.pravatar.cc/100?img=${i+10}`} alt={t("userAlt")} width={40} height={40} />
                    </div>
                  ))}
                  <div className="pl-5 text-sm font-bold text-gray-400">{t("studentsCount")}</div>
               </div>
            </div>
          </div>
        </div>

        {/* СРЕДНЯЯ ЧАСТЬ: Описание и Навыки */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 border-t border-gray-100 pt-16">
          <div className="lg:col-span-2 space-y-8">
            <div>
              <h3 className="text-2xl font-bold text-midnight_text mb-4">{t("about")}</h3>
              <p className="text-gray-600 text-lg leading-relaxed whitespace-pre-line">
                {course.description}
              </p>
            </div>

            {/* ГАЛЕРЕЯ (из поля gallery в JSON) */}
            {course.gallery && course.gallery.length > 0 && (
              <div>
                <h3 className="text-2xl font-bold text-midnight_text mb-6">{t("galleryTitle")}</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {course.gallery.map((img: string, idx: number) => (
                    <div key={idx} className="relative aspect-square rounded-3xl overflow-hidden cursor-zoom-in hover:opacity-90 transition-opacity shadow-sm">
                      <Image src={img} alt={t("galleryAlt")} fill className="object-cover" />
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
              {t("whatYouLearn")}
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
               <p className="text-xs font-bold opacity-80 uppercase mb-2">{t("certificate")}</p>
               <p className="text-sm font-medium leading-tight">{t("certificateText")}</p>
            </div>
          </div>
        </div>

        {/* ── RELATED ── */}
        {otherCourses.length > 0 && (
          <RelatedSectionBlock title={t("otherCourses")}>
            {otherCourses.map((c, i) => <RelatedCourseCard key={i} course={c} />)}
          </RelatedSectionBlock>
        )}
      </div>
    </main>
  );
}