import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getSiteStructure, makeSlug } from "@/utils/apiData";
import { pageMetadata, truncate, SITE_NAME } from "@/utils/seo";
import { RelatedTeacherCard, RelatedSectionBlock } from "@/app/components/RelatedSection";
import { ArrowLeft, BookOpen, GraduationCap } from "lucide-react";

// Все учителя из блоков teachers_grid и поиск по slug (тот же алгоритм, что в карточках)
async function findTeacher(slug: string, locale: string) {
  const response = await getSiteStructure(locale);
  let all: any[] = [];
  response.structure.forEach((page: any) => {
    page.blocks?.forEach((block: any) => {
      if (block.type === 'teachers_grid') {
        try {
          const parsed = JSON.parse(block.content || "[]");
          if (Array.isArray(parsed)) all = [...all, ...parsed];
          else if (parsed && typeof parsed === 'object') all.push(parsed);
        } catch {}
      }
    });
  });
  return all.find(t => t?.fullName && (t._slug ?? makeSlug(t.fullName)) === slug);
}

// Заголовок и описание страницы учителя для поисковиков и превью в мессенджерах
export async function generateMetadata({ params }: { params: Promise<{ slug: string; locale: string }> }): Promise<Metadata> {
  const { slug, locale } = await params;
  const t = await getTranslations({ locale, namespace: "MentorDetail" });
  try {
    const teacher = await findTeacher(slug, locale);
    if (teacher) {
      const name = String(teacher.fullName).trim();
      const subject = teacher.subject ? String(teacher.subject).trim() : '';
      return pageMetadata({
        title: subject ? t("metaTitleSubject", { name, subject }) : t("metaTitle", { name }),
        description:
          truncate(teacher.bio) ||
          (subject
            ? t("metaDescriptionSubject", { name, subject, site: SITE_NAME })
            : t("metaDescription", { name, site: SITE_NAME })),
        path: `/mentors/${slug}`,
        image: teacher.photo,
        locale,
      });
    }
  } catch {}
  return pageMetadata({ title: t("metaFallback"), path: `/mentors/${slug}`, noindex: true, locale });
}

export default async function TeacherDetailPage({ params }: { params: Promise<{ slug: string; locale: string }> }) {
  const { slug, locale } = await params;
  const t = await getTranslations({ locale, namespace: "MentorDetail" });
  const yearsLabel = (v: unknown) => {
    const s = String(v).trim();
    return /^\d+$/.test(s) ? t("years", { count: Number(s) }) : t("yearsRaw", { value: s });
  };
  const response = await getSiteStructure(locale);

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

  const teacher = allTeachers.find(x =>
    (x._slug ?? makeSlug(x.fullName)) === slug
  );
  const otherTeachers = allTeachers
    .filter(x => (x._slug ?? makeSlug(x.fullName)) !== slug)
    .slice(0, 4);

  // Настоящий HTTP 404 вместо «200 + текст ошибки»
  if (!teacher) notFound();

  return (
    <main className="min-h-screen pt-28 pb-20" style={{ background: '#f2f9f6' }}>
      <div className="container mx-auto px-4">

        {/* Back link */}
        <Link
          href="/#mentor"
          className="inline-flex items-center gap-1.5 text-sm font-semibold mb-8 transition-colors hover:text-primary"
          style={{ color: '#3f5570' }}
        >
          <ArrowLeft className="h-4 w-4" />
          {t("allMentors")}
        </Link>

        {/* Hero card */}
        <div className="glass-card rounded-3xl overflow-hidden shadow-xl mb-8">
          <div className="flex flex-col md:flex-row">

            {/* Left: photo + gradient overlay */}
            <div className="relative w-full md:w-80 lg:w-96 shrink-0">
              <div className="relative aspect-[3/4] md:aspect-auto md:h-full min-h-[360px] overflow-hidden">
                <Image
                  src={teacher.photo || '/images/mentor/placeholder.webp'}
                  alt={teacher.fullName}
                  fill
                  className="object-cover"
                  priority
                />
                {/* Gradient overlay on photo */}
                <div
                  className="absolute inset-0"
                  style={{
                    background: 'linear-gradient(to top, rgba(11,111,93,0.7) 0%, rgba(23,165,137,0.1) 50%, transparent 100%)',
                  }}
                />
                {/* Subject label on photo */}
                <div className="absolute bottom-5 left-5 right-5">
                  <span
                    className="inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider text-white mb-2"
                    style={{ background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)' }}
                  >
                    {teacher.subject}
                  </span>
                  <p className="text-white font-black text-xl leading-tight drop-shadow-lg">
                    {teacher.fullName}
                  </p>
                </div>
              </div>
            </div>

            {/* Right: info */}
            <div className="flex-1 p-7 md:p-10 space-y-7">

              {/* Name + subject (shown on desktop, hidden on mobile where photo has it) */}
              <div className="hidden md:block">
                <h1 className="text-3xl lg:text-4xl font-black" style={{ color: '#0c2440' }}>
                  {teacher.fullName}
                </h1>
                <p className="text-lg font-bold mt-1" style={{ color: '#17a589' }}>
                  {teacher.subject}
                </p>
              </div>

              {/* Stats row */}
              <div className="flex flex-wrap gap-3">
                {teacher.experience && (
                  <div
                    className="flex items-center gap-2.5 px-4 py-3 rounded-2xl"
                    style={{ background: 'rgba(23,165,137,0.08)', border: '1px solid rgba(23,165,137,0.15)' }}
                  >
                    <BookOpen className="h-4 w-4 shrink-0" style={{ color: '#17a589' }} />
                    <div>
                      <div className="text-xs uppercase tracking-wide font-semibold" style={{ color: '#3f5570' }}>{t("experience")}</div>
                      <div className="text-base font-black" style={{ color: '#0c2440' }}>{yearsLabel(teacher.experience)}</div>
                    </div>
                  </div>
                )}
                {teacher.age && (
                  <div
                    className="flex items-center gap-2.5 px-4 py-3 rounded-2xl"
                    style={{ background: 'rgba(23,165,137,0.08)', border: '1px solid rgba(23,165,137,0.15)' }}
                  >
                    <GraduationCap className="h-4 w-4 shrink-0" style={{ color: '#17a589' }} />
                    <div>
                      <div className="text-xs uppercase tracking-wide font-semibold" style={{ color: '#3f5570' }}>{t("age")}</div>
                      <div className="text-base font-black" style={{ color: '#0c2440' }}>{yearsLabel(teacher.age)}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Bio */}
              {teacher.bio && (
                <div>
                  <h3 className="text-base font-black uppercase tracking-wider mb-3" style={{ color: '#0c2440' }}>
                    {t("aboutTeacher")}
                  </h3>
                  <p className="leading-relaxed whitespace-pre-line" style={{ color: '#3f5570' }}>
                    {teacher.bio}
                  </p>
                </div>
              )}

              {/* Certificates */}
              {teacher.certificates && teacher.certificates.length > 0 && (
                <div className="pt-5 border-t" style={{ borderColor: 'rgba(23,165,137,0.15)' }}>
                  <h3 className="text-base font-black uppercase tracking-wider mb-4" style={{ color: '#0c2440' }}>
                    {t("certificates")}
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {teacher.certificates.map((cert: string, idx: number) => (
                      <div
                        key={idx}
                        className="relative aspect-video rounded-xl overflow-hidden border cursor-zoom-in hover:scale-105 transition-transform"
                        style={{ borderColor: 'rgba(23,165,137,0.2)' }}
                      >
                        <Image src={cert} alt={t("certificateAlt")} fill className="object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Other teachers */}
        {otherTeachers.length > 0 && (
          <RelatedSectionBlock title={t("otherTeachers")}>
            {otherTeachers.map((x, i) => <RelatedTeacherCard key={i} teacher={x} />)}
          </RelatedSectionBlock>
        )}
      </div>
    </main>
  );
}
