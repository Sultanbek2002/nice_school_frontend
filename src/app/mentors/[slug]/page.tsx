import React from "react";
import Image from "next/image";
import Link from "next/link";
import { getSiteStructure } from "@/utils/apiData";
import { RelatedTeacherCard, RelatedSectionBlock } from "@/app/components/RelatedSection";
import { ArrowLeft, BookOpen, GraduationCap } from "lucide-react";

export default async function TeacherDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const response = await getSiteStructure();

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

  const teacher = allTeachers.find(t =>
    encodeURIComponent(t.fullName.toLowerCase().replace(/\s+/g, '-')) === slug
  );
  const otherTeachers = allTeachers
    .filter(t => encodeURIComponent(t.fullName.toLowerCase().replace(/\s+/g, '-')) !== slug)
    .slice(0, 4);

  if (!teacher) {
    return (
      <main className="min-h-screen pt-40 pb-20 text-center">
        <p className="text-grey text-lg">Учитель не найден</p>
        <Link href="/#mentor" className="mt-6 inline-block text-primary font-semibold hover:underline">
          ← Вернуться к менторам
        </Link>
      </main>
    );
  }

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
          Все менторы
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
                      <div className="text-xs uppercase tracking-wide font-semibold" style={{ color: '#3f5570' }}>Стаж</div>
                      <div className="text-base font-black" style={{ color: '#0c2440' }}>{teacher.experience} лет</div>
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
                      <div className="text-xs uppercase tracking-wide font-semibold" style={{ color: '#3f5570' }}>Возраст</div>
                      <div className="text-base font-black" style={{ color: '#0c2440' }}>{teacher.age} лет</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Bio */}
              {teacher.bio && (
                <div>
                  <h3 className="text-base font-black uppercase tracking-wider mb-3" style={{ color: '#0c2440' }}>
                    О преподавателе
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
                    Сертификаты
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {teacher.certificates.map((cert: string, idx: number) => (
                      <div
                        key={idx}
                        className="relative aspect-video rounded-xl overflow-hidden border cursor-zoom-in hover:scale-105 transition-transform"
                        style={{ borderColor: 'rgba(23,165,137,0.2)' }}
                      >
                        <Image src={cert} alt="certificate" fill className="object-cover" />
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
          <RelatedSectionBlock title="Другие учителя">
            {otherTeachers.map((t, i) => <RelatedTeacherCard key={i} teacher={t} />)}
          </RelatedSectionBlock>
        )}
      </div>
    </main>
  );
}
