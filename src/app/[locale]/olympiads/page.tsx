"use client";
import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { Icon } from "@iconify/react";
import { useLocale, useTranslations } from "next-intl";
import { enumLabel } from "@/i18n/enumLabels";
import { GO_API_URL } from "@/utils/apiData";

interface Olympiad {
  ID: number;
  title: string;
  description: string;
  subject: string;
  date: string;
  start_time: string | null;
  image_url: string;
  file_url: string;
  format: string;
  location: string;
  status: string;
  time_limit: number;
}

// Format ISO date using UTC (stored time = displayed time, no timezone shift)
function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getDate()}-${pad(d.getMonth() + 1)}-${d.getFullYear()}  ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch { return ""; }
}

async function openPDF(url: string) {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const pdfBlob = new Blob([blob], { type: "application/pdf" });
    window.open(URL.createObjectURL(pdfBlob), "_blank");
  } catch {
    window.open(url, "_blank");
  }
}

/* ---------- 3D Tilt Card ---------- */
function TiltCard({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [glow, setGlow] = useState({ x: 50, y: 50 });
  const [hovered, setHovered] = useState(false);

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    setTilt({ x: (py - 0.5) * 14, y: -(px - 0.5) * 14 });
    setGlow({ x: px * 100, y: py * 100 });
  };

  return (
    <div
      ref={ref}
      className={className}
      onMouseMove={onMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setTilt({ x: 0, y: 0 }); }}
      style={{
        transform: hovered
          ? `perspective(900px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(1.03)`
          : "perspective(900px) rotateX(0deg) rotateY(0deg) scale(1)",
        transition: hovered ? "transform 0.08s ease-out" : "transform 0.5s ease-out",
        willChange: "transform",
        "--gx": `${glow.x}%`,
        "--gy": `${glow.y}%`,
      } as React.CSSProperties}
    >
      {children}
    </div>
  );
}

/* ---------- Animated Counter ---------- */
function Counter({ value }: { value: number }) {
  const [count, setCount] = useState(0);
  const started = useRef(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        let start = 0;
        const step = Math.ceil(value / 40);
        const timer = setInterval(() => {
          start += step;
          if (start >= value) { setCount(value); clearInterval(timer); }
          else setCount(start);
        }, 30);
      }
    }, { threshold: 0.5 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [value]);

  return <span ref={ref}>{count}</span>;
}

/* ---------- Subject Icon ---------- */
function subjectIcon(subject: string): string {
  const s = subject.toLowerCase();
  if (s.includes("матем")) return "solar:calculator-bold-duotone";
  if (s.includes("инфор") || s.includes("it")) return "solar:laptop-bold-duotone";
  if (s.includes("физик")) return "solar:atom-bold-duotone";
  if (s.includes("хими")) return "solar:flask-bold-duotone";
  if (s.includes("биол")) return "solar:leaf-bold-duotone";
  if (s.includes("тарых") || s.includes("истор")) return "solar:book-bold-duotone";
  if (s.includes("адабият") || s.includes("литер")) return "solar:pen-bold-duotone";
  if (s.includes("кыргыз") || s.includes("тил")) return "solar:letter-bold-duotone";
  if (s.includes("чет тил") || s.includes("англис")) return "solar:global-bold-duotone";
  if (s.includes("геогр")) return "solar:map-bold-duotone";
  return "solar:star-bold-duotone";
}

function subjectColor(subject: string): string {
  const s = subject.toLowerCase();
  if (s.includes("матем")) return "#17a589";
  if (s.includes("инфор") || s.includes("it")) return "#0b6f5d";
  if (s.includes("физик")) return "#17a589";
  if (s.includes("хими")) return "#0b6f5d";
  if (s.includes("биол")) return "#17a589";
  if (s.includes("тарых") || s.includes("истор")) return "#0b6f5d";
  if (s.includes("адабият") || s.includes("литер")) return "#17a589";
  if (s.includes("кыргыз") || s.includes("тил")) return "#0b6f5d";
  if (s.includes("чет тил") || s.includes("англис")) return "#17a589";
  if (s.includes("геогр")) return "#0b6f5d";
  return "#17a589";
}

// Sentinel for the "all subjects" filter — never a real subject value.
const ALL = "__all__";

export default function OlympiadsPage() {
  const [olympiads, setOlympiads] = useState<Olympiad[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSubject, setActiveSubject] = useState(ALL);
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState("");

  const locale = useLocale();
  const t = useTranslations("OlympiadsPage");
  const tEnums = useTranslations("Enums");

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    fetch(`${GO_API_URL}/api/olympiads?lang=${locale}`)
      .then((r) => r.json())
      .then((d) => setOlympiads(Array.isArray(d) ? d : []))
      .catch(() => setOlympiads([]))
      .finally(() => setLoading(false));
  }, [locale]);

  const subjects = [ALL, ...Array.from(new Set(olympiads.map((o) => o.subject).filter(Boolean)))];

  const filtered = olympiads.filter((o) => {
    const matchSub = activeSubject === ALL || o.subject === activeSubject;
    const matchSearch = !search || o.title.toLowerCase().includes(search.toLowerCase()) || o.subject.toLowerCase().includes(search.toLowerCase());
    return matchSub && matchSearch;
  });

  return (
    <main className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-gray via-white to-deep-slate">
      <style>{`
        @keyframes spin-slow { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        .card-shine::before {
          content:'';
          position:absolute;
          inset:0;
          border-radius:inherit;
          background: radial-gradient(circle at var(--gx,50%) var(--gy,50%), rgba(255,255,255,0.7) 0%, transparent 55%);
          pointer-events:none;
          z-index:1;
          opacity:0;
          transition: opacity 0.2s;
        }
        .card-shine:hover::before { opacity:1; }
      `}</style>

      {/* Subtle decorative blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute top-20 -right-20 h-96 w-96 rounded-full bg-secondary/10 blur-3xl" />
      </div>

      <div className="relative z-10 pt-32 pb-24 container mx-auto px-4">

        {/* ── HERO ── */}
        <div className="text-center mb-16 space-y-6">
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest shadow-md bg-white border border-primary/10 text-midnight_text">
            {mounted && <Icon icon="solar:cup-bold-duotone" width={16} className="text-primary" />}
            NICE International School
          </div>

          <h1 className="text-5xl md:text-6xl font-black tracking-tight leading-[1.05] text-midnight_text">
            {t("title")}
          </h1>

          <p className="text-base md:text-lg max-w-2xl mx-auto leading-relaxed text-slate-500">
            {t("subtitle")}
          </p>

          {/* Stats row */}
          {!loading && olympiads.length > 0 && (
            <div className="flex justify-center gap-8 pt-4">
              {[
                { label: t("statOlympiads"), value: olympiads.length, color: "#17a589", bg: "rgba(23,165,137,0.08)" },
                { label: t("statSubjects"), value: subjects.length - 1, color: "#0b6f5d", bg: "rgba(11,111,93,0.08)" },
                { label: t("statOnline"), value: olympiads.filter(o => o.format === "Онлайн").length, color: "#17a589", bg: "rgba(23,165,137,0.08)" },
              ].map((stat) => (
                <div key={stat.label} className="text-center px-6 py-4 rounded-2xl shadow-sm" style={{ background: stat.bg, border: `1.5px solid ${stat.color}22` }}>
                  <div className="text-3xl font-black" style={{ color: stat.color }}>
                    {mounted && <Counter value={stat.value} />}
                    {!mounted && stat.value}
                  </div>
                  <div className="text-xs font-bold mt-1 text-slate-500">{stat.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── SEARCH + SUBJECT FILTER ── */}
        <div className="space-y-4 mb-12">
          {/* Search bar */}
          <div className="max-w-md mx-auto relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              {mounted && <Icon icon="solar:magnifer-bold-duotone" width={18} />}
            </div>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("searchPlaceholder")}
              className="w-full pl-11 pr-4 py-3 rounded-2xl text-sm font-medium outline-none text-midnight_text placeholder-slate-400 bg-white/90 border border-slate-200 shadow-md backdrop-blur-sm focus:border-primary/40"
            />
          </div>

          {/* Subject pills */}
          <div className="flex flex-wrap justify-center gap-3">
            {subjects.map((subj) => {
              const isActive = activeSubject === subj;
              const color = subj === ALL ? "#17a589" : subjectColor(subj);
              return (
                <button
                  key={subj}
                  onClick={() => setActiveSubject(subj)}
                  className="flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-bold transition-all duration-300"
                  style={{
                    background: isActive ? color : "rgba(255,255,255,0.8)",
                    border: `1.5px solid ${isActive ? color : "rgba(0,0,0,0.08)"}`,
                    color: isActive ? "#fff" : "#3f5570",
                    boxShadow: isActive ? `0 8px 24px ${color}44` : "0 2px 8px rgba(0,0,0,0.05)",
                    transform: isActive ? "translateY(-3px) scale(1.03)" : "none",
                  }}
                >
                  {mounted && subj !== ALL && <Icon icon={subjectIcon(subj)} width={14} />}
                  {subj === ALL && mounted && <Icon icon="solar:widget-bold-duotone" width={14} />}
                  {subj === ALL ? t("all") : enumLabel(tEnums, subj)}
                  <span
                    className="px-1.5 py-0.5 rounded-lg text-xs font-black"
                    style={{ background: isActive ? "rgba(255,255,255,0.25)" : `${color}18`, color: isActive ? "#fff" : color }}
                  >
                    {subj === ALL ? olympiads.length : olympiads.filter(o => o.subject === subj).length}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── LOADING ── */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="w-12 h-12 rounded-full border-3 border-transparent" style={{ borderTopColor: "#17a589", borderWidth: "3px", animation: "spin-slow 1s linear infinite" }} />
            <p className="text-sm font-bold text-slate-400">{t("loading")}</p>
          </div>
        )}

        {/* ── EMPTY ── */}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-32 space-y-3">
            <div className="text-6xl">🔍</div>
            <p className="text-xl font-black text-midnight_text">{t("notFound")}</p>
            <p className="text-sm text-slate-400">{t("notFoundHint")}</p>
          </div>
        )}

        {/* ── GRID ── */}
        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((item) => {
              const color = subjectColor(item.subject);
              const isOnline = item.format === "Онлайн";

              return (
                <TiltCard key={item.ID} className="h-full">
                  <div
                    className="card-shine relative h-full flex flex-col rounded-3xl overflow-hidden bg-white shadow-md"
                    style={{
                      border: `1.5px solid ${color}30`,
                      boxShadow: `0 4px 30px ${color}18, 0 1px 4px rgba(0,0,0,0.05)`,
                    }}
                  >
                    {/* Colored top stripe */}
                    <div className="h-1.5 w-full" style={{ background: `linear-gradient(90deg, ${color}, ${color}88, transparent)` }} />

                    {/* Image */}
                    <div className="relative h-48 w-full overflow-hidden">
                      <Image
                        src={item.image_url || "/images/courses/placeholder.png"}
                        alt={item.title}
                        fill
                        className="object-cover transition-transform duration-700 hover:scale-105"
                      />
                      <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.5) 100%)" }} />

                      {/* Format badge */}
                      <div
                        className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1.5 rounded-2xl backdrop-blur-md text-[10px] font-black uppercase tracking-wider"
                        style={{
                          background: "rgba(255,255,255,0.92)",
                          border: `1px solid ${isOnline ? "#17a589" : "#0b6f5d"}44`,
                          color: isOnline ? "#17a589" : "#0b6f5d",
                          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
                        }}
                      >
                        <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: isOnline ? "#17a589" : "#0b6f5d" }} />
                        {enumLabel(tEnums, item.format)}
                      </div>

                      {/* Subject badge */}
                      <div
                        className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase"
                        style={{ background: color, color: "#fff", boxShadow: `0 4px 12px ${color}66` }}
                      >
                        {mounted && <Icon icon={subjectIcon(item.subject)} width={12} />}
                        {enumLabel(tEnums, item.subject)}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex flex-col flex-grow p-6 space-y-4 relative z-10">
                      <h3 className="text-base font-black text-midnight_text leading-snug line-clamp-2">
                        {item.title}
                      </h3>
                      <p className="text-xs leading-relaxed line-clamp-2 text-slate-500">
                        {item.description || t("descriptionSoon")}
                      </p>

                      {/* Meta info */}
                      <div className="space-y-2 pt-3 border-t border-slate-100">
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                          {mounted && <Icon icon="solar:calendar-date-bold-duotone" width={14} style={{ color }} />}
                          {item.start_time ? fmtDate(item.start_time) : (item.date || t("dateTbd"))}
                        </div>
                        {item.time_limit > 0 && (
                          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                            {mounted && <Icon icon="solar:clock-circle-bold-duotone" width={14} style={{ color }} />}
                            {t("testMinutes", { minutes: item.time_limit })}
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 truncate">
                          {mounted && <Icon icon="solar:map-point-bold-duotone" width={14} className="text-secondary flex-shrink-0" />}
                          <span className="truncate">{item.location || t("locationTbd")}</span>
                        </div>
                      </div>

                      {/* Buttons */}
                      <div className="flex gap-2 mt-auto pt-2">
                        {item.file_url && (
                          <button
                            onClick={() => openPDF(item.file_url)}
                            className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105 bg-primary/10 border border-primary/30 text-primary"
                          >
                            {mounted && <Icon icon="solar:document-download-bold-duotone" width={14} />}
                            PDF
                          </button>
                        )}
                        <Link
                          href={`/olympiads/${item.ID}`}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-full text-xs font-black transition-all relative overflow-hidden group hover:scale-[1.02] bg-primary hover:brightness-110 text-white shadow-lg"
                        >
                          <span className="relative z-10 flex items-center gap-1.5">
                            {mounted && <Icon icon="solar:arrow-right-bold-duotone" width={14} />}
                            {t("participate")}
                          </span>
                          <span
                            className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-500"
                            style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)" }}
                          />
                        </Link>
                      </div>
                    </div>
                  </div>
                </TiltCard>
              );
            })}
          </div>
        )}

        {/* ── BOTTOM CTA ── */}
        {!loading && olympiads.length > 0 && (
          <div className="mt-20 text-center">
            <div
              className="inline-flex flex-col items-center gap-4 px-12 py-10 rounded-[2.5rem] bg-white shadow-md"
              style={{
                border: "1.5px solid rgba(23,165,137,0.15)",
              }}
            >
              <div className="text-4xl">🏆</div>
              <h3 className="text-2xl font-black text-midnight_text">{t("ctaTitle")}</h3>
              <p className="text-sm max-w-sm text-center text-slate-500">
                {t("ctaText")}
              </p>
              <Link
                href="/#contact"
                className="px-8 py-3 rounded-full text-sm font-black text-white transition-all hover:scale-105 bg-primary hover:brightness-110 shadow-lg"
              >
                {t("ctaButton")}
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
