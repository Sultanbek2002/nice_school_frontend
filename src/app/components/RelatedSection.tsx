import React from "react";
import Link from "next/link";
import Image from "next/image";

// ─── Course mini-card ───────────────────────────────────────
export function RelatedCourseCard({ course }: { course: any }) {
  const slug = encodeURIComponent(course.title.toLowerCase().replace(/\s+/g, "-"));
  return (
    <Link href={`/courses/${slug}`} className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex flex-col">
      <div className="relative h-40 overflow-hidden bg-slate-100">
        {course.mainImage ? (
          <Image src={course.mainImage} alt={course.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl opacity-30">📚</div>
        )}
        <div className="absolute top-2 left-2 bg-primary/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
          {course.targetAud}+ лет
        </div>
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <h4 className="font-bold text-slate-800 line-clamp-2 group-hover:text-primary transition-colors mb-1">{course.title}</h4>
        <p className="text-xs text-slate-400 mt-auto">{course.duration} мес. · {course.format || "Онлайн"}</p>
      </div>
    </Link>
  );
}

// ─── Teacher mini-card ──────────────────────────────────────
export function RelatedTeacherCard({ teacher }: { teacher: any }) {
  const slug = encodeURIComponent(teacher.fullName.toLowerCase().replace(/\s+/g, "-"));
  return (
    <Link href={`/mentors/${slug}`} className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex flex-col items-center p-5 text-center">
      <div className="relative w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow mb-3">
        {teacher.photo ? (
          <Image src={teacher.photo} alt={teacher.fullName} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-2xl font-bold">
            {teacher.fullName?.charAt(0)}
          </div>
        )}
      </div>
      <h4 className="font-bold text-slate-800 text-sm group-hover:text-primary transition-colors line-clamp-2">{teacher.fullName}</h4>
      <p className="text-xs text-primary font-semibold mt-1">{teacher.subject}</p>
      <p className="text-xs text-slate-400 mt-1">{teacher.experience} лет опыта</p>
    </Link>
  );
}

// ─── Game mini-card ─────────────────────────────────────────
export function RelatedGameCard({ game, href }: { game: any; href: string }) {
  return (
    <Link href={href} className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex flex-col">
      <div className="relative h-36 bg-slate-100 overflow-hidden">
        {game.thumbnail ? (
          <Image src={game.thumbnail} alt={game.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl opacity-30">🎮</div>
        )}
        <span className="absolute top-2 left-2 bg-black/70 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{game.game_type || "HTML"}</span>
        <div className="absolute bottom-2 right-2 w-8 h-8 rounded-full border-2 border-white shadow bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center">
          <span className="text-white text-xs font-bold">{(game.developer_name || "N").charAt(0)}</span>
        </div>
      </div>
      <div className="p-3">
        <h4 className="font-bold text-slate-800 text-sm line-clamp-2 group-hover:text-teal-600 transition-colors">{game.title}</h4>
        <p className="text-xs text-slate-400 mt-1">{game.developer_name}</p>
      </div>
    </Link>
  );
}

// ─── Resource mini-card ─────────────────────────────────────
export function RelatedResourceCard({ resource }: { resource: any }) {
  return (
    <a
      href={resource.file_url ? resource.file_url : "#"}
      target={resource.file_url ? "_blank" : undefined}
      rel="noreferrer"
      className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex gap-3 p-4 items-center"
    >
      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
        <span className="text-xl">📄</span>
      </div>
      <div className="min-w-0">
        <h4 className="font-bold text-slate-800 text-sm line-clamp-1 group-hover:text-primary transition-colors">{resource.title}</h4>
        <p className="text-xs text-slate-400 mt-0.5">{resource.subject} · {resource.category}</p>
        <span className={`text-[10px] font-bold mt-1 inline-block ${resource.status === "free" ? "text-green-600" : "text-amber-600"}`}>
          {resource.status === "free" ? "Бесплатно" : "Платно"}
        </span>
      </div>
    </a>
  );
}

// ─── Olympiad mini-card ─────────────────────────────────────
export function RelatedOlympiadCard({ olympiad }: { olympiad: any }) {
  const statusColor: Record<string, string> = {
    open: "bg-green-100 text-green-700",
    registration: "bg-green-100 text-green-700",
    upcoming: "bg-blue-100 text-blue-700",
    active: "bg-violet-100 text-violet-700",
    closed: "bg-slate-100 text-slate-500",
    finished: "bg-slate-100 text-slate-500",
    draft: "bg-amber-100 text-amber-700",
  };
  const statusLabel: Record<string, string> = {
    open: "Запись открыта",
    registration: "Запись открыта",
    upcoming: "Скоро",
    active: "Идёт",
    closed: "Завершена",
    finished: "Завершена",
    draft: "Готовится",
  };
  return (
    <Link href={`/olympiads/${olympiad.ID}`} className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex flex-col">
      <div className="relative h-36 bg-slate-100 overflow-hidden">
        {olympiad.image_url ? (
          <Image src={olympiad.image_url} alt={olympiad.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl opacity-30">🏆</div>
        )}
        <span className={`absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColor[olympiad.status] || statusColor.closed}`}>
          {statusLabel[olympiad.status] || olympiad.status}
        </span>
      </div>
      <div className="p-4">
        <h4 className="font-bold text-slate-800 text-sm line-clamp-2 group-hover:text-primary transition-colors">{olympiad.title}</h4>
        <p className="text-xs text-slate-400 mt-1">{olympiad.subject}</p>
      </div>
    </Link>
  );
}

// ─── Section wrapper ────────────────────────────────────────
interface SectionProps { title: string; children: React.ReactNode }
export function RelatedSectionBlock({ title, children }: SectionProps) {
  return (
    <div className="border-t border-slate-100 pt-12 mt-12">
      <h2 className="text-2xl font-black text-slate-800 mb-6">{title}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {children}
      </div>
    </div>
  );
}
