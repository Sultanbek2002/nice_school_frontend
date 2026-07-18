"use client";
import { useRef, useState, useEffect } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import type { MotionValue } from "framer-motion";
import Link from "next/link";
import { GO_API_URL } from "@/utils/apiData";

const MD   = motion.div    as any;
const MP   = motion.p      as any;
const MH1  = motion.h1     as any;
const MH2  = motion.h2     as any;
const MH3  = motion.h3     as any;
const MBtn = motion.button as any;

function teacherSlug(name: string) {
  return encodeURIComponent(name.toLowerCase().replace(/\s+/g, "-"));
}

interface Cabinet {
  id: number;
  name: string;
  teacher?: string;
  description: string;
  photo: string;
  gradFrom: string;
  gradTo: string;
}

interface ApiCabinet {
  ID: number;
  name: string;
  teacher: string;
  description: string;
  photo: string;
  icon: string;
  grad_from: string;
  grad_to: string;
  sort_order: number;
}

function mapCabinet(c: ApiCabinet): Cabinet {
  return {
    id: c.ID,
    name: c.name,
    teacher: c.teacher || undefined,
    description: c.description,
    photo: c.photo,
    gradFrom: c.grad_from || "#17a589",
    gradTo: c.grad_to || "#0b6f5d",
  };
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function CabinetModal({ cabinet, onClose }: { cabinet: Cabinet; onClose: () => void }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", h);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", h);
    };
  }, [onClose]);

  return (
    <MD
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/70" style={{ backdropFilter: "blur(6px)" }} />

      <MD
        layoutId={`plaque-${cabinet.id}`}
        className="relative z-10 w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl bg-white max-h-[92dvh] flex flex-col"
        transition={{ duration: 0.45, ease: [0.32, 0.72, 0, 1] }}
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
        initial={{ y: 60 }}
        animate={{ y: 0 }}
        exit={{ y: 60 }}
      >
        {/* Mobile drag handle */}
        <div className="sm:hidden flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-slate-200" />
        </div>

        {/* Photo — shorter on mobile */}
        <div
          className="relative h-44 sm:aspect-video sm:h-auto flex-shrink-0 overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${cabinet.gradFrom}, ${cabinet.gradTo})` }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={cabinet.photo}
            alt={cabinet.name}
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(ellipse at 30% 40%, rgba(255,255,255,0.12) 0%, transparent 55%)" }}
          />
        </div>

        {/* Content — scrollable if overflow */}
        <div className="overflow-y-auto flex-1 p-5 sm:p-7">
          <MH2
            layoutId={`plaque-title-${cabinet.id}`}
            className="text-xl sm:text-2xl font-black text-slate-900 mb-1.5"
          >
            {cabinet.name}
          </MH2>

          {cabinet.teacher && (
            <MP
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="text-sm font-bold mb-3"
            >
              <span className="text-slate-500">Преподаватель: </span>
              <Link
                href={`/mentors/${teacherSlug(cabinet.teacher)}`}
                className="hover:underline"
                style={{ color: "#17a589" }}
                onClick={e => e.stopPropagation()}
              >
                {cabinet.teacher} →
              </Link>
            </MP>
          )}

          <MP
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="text-sm sm:text-base text-slate-600 leading-relaxed"
          >
            {cabinet.description}
          </MP>
        </div>

        {/* Close */}
        <MBtn
          className="absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center text-white font-black text-sm"
          style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(8px)" }}
          initial={{ opacity: 0, scale: 0.75 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onClose}
        >
          ✕
        </MBtn>
      </MD>
    </MD>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CabinetsPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const [cabinets, setCabinets] = useState<Cabinet[]>([]);
  const [loading, setLoading] = useState(true);
  const [facadePhoto, setFacadePhoto] = useState("");
  const [interiorPhoto, setInteriorPhoto] = useState("");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setMounted(true);
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    fetch(`${GO_API_URL}/api/school-cabinets`)
      .then(r => r.ok ? r.json() : [])
      .then((data: ApiCabinet[]) => setCabinets(Array.isArray(data) ? data.map(mapCabinet) : []))
      .catch(() => setCabinets([]))
      .finally(() => setLoading(false));

    fetch(`${GO_API_URL}/api/school-tour-settings`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d) {
          setFacadePhoto(d.facade_photo || "");
          setInteriorPhoto(d.interior_photo || "");
        }
      })
      .catch(() => {});
  }, []);

  const { scrollYProgress } = useScroll({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    target: containerRef as any,
    offset: ["start start", "end start"],
  });

  // On mobile portrait: less zoom so the building stays in frame
  const maxScale       = isMobile ? 1.6 : 2.2;
  const sceneScale      = useTransform(scrollYProgress, [0, 1], [1, maxScale]);
  const facadeOpacity   = useTransform(scrollYProgress, [0.3, 0.65], [1, 0]);
  const interiorOpacity = useTransform(scrollYProgress, [0.3, 0.65], [0, 1]);
  const hintOpacity     = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const titleOpacity    = useTransform(scrollYProgress, [0.7, 1], [0, 1]);
  const titleY          = useTransform(scrollYProgress, [0.7, 1], [40, 0]);

  // Shorter scroll scene on mobile — less fatigue
  const sceneHeight = isMobile ? "210vh" : "280vh";

  const selectedCabinet = cabinets.find((c) => c.id === selectedId) ?? null;

  return (
    <>
      {/* ── Scroll scene ── */}
      <div ref={containerRef} style={{ height: sceneHeight }}>
        <div
          className="sticky top-0 w-full overflow-hidden"
          style={{ height: "100dvh", background: "#0c2440" }}
        >
          {/* Масштабируемый контейнер */}
          <MD
            className="absolute inset-0 w-full h-full"
            style={{
              scale: sceneScale,
              transformOrigin: isMobile ? "50% 50%" : "50% 60%",
            }}
          >
            {/* Фото фасада */}
            <MD style={{ opacity: facadeOpacity }} className="absolute inset-0">
              {facadePhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={facadePhoto}
                  alt="Фасад школы"
                  className="absolute inset-0 w-full h-full object-cover object-center"
                  draggable={false}
                />
              ) : (
                <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, #0c2440, #0b6f5d)" }} />
              )}
            </MD>

            {/* Фото интерьера */}
            <MD style={{ opacity: interiorOpacity }} className="absolute inset-0">
              {interiorPhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={interiorPhoto}
                  alt="Интерьер школы"
                  className="absolute inset-0 w-full h-full object-cover object-center"
                  draggable={false}
                />
              ) : (
                <div
                  className="absolute inset-0"
                  style={{ background: "linear-gradient(180deg, #0c2440 0%, #0b6f5d 55%, #17a589 100%)" }}
                />
              )}
            </MD>

            {/* Виньетка */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: "radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(0,0,0,0.55) 100%)",
              }}
            />
          </MD>

          {/* Оверлей перехода */}
          <MD
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "rgba(0,0,0,0.15)",
              opacity: useTransform(scrollYProgress, [0.35, 0.55], [0, 0.4]) as MotionValue<number>,
            }}
          />

          {/* Подсказка скролла */}
          {mounted && (
            <MD
              className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none"
              style={{
                opacity: hintOpacity,
                bottom: "max(2.5rem, env(safe-area-inset-bottom, 2.5rem))",
              }}
            >
              <MD
                className="flex flex-col items-center gap-2"
                animate={{ y: [0, 9, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <p className="text-white/55 text-xs sm:text-sm font-bold tracking-wider">Прокрутите вниз</p>
                <div className="w-5 h-8 sm:w-6 sm:h-9 rounded-full border-2 border-white/25 flex justify-center pt-1.5">
                  <div className="w-1 h-1.5 sm:h-2 rounded-full bg-white/50" />
                </div>
              </MD>
            </MD>
          )}

          {/* Заголовок секции кабинетов */}
          <MD
            className="absolute left-0 right-0 text-center pointer-events-none px-4"
            style={{
              opacity: titleOpacity,
              y: titleY,
              bottom: "max(3rem, env(safe-area-inset-bottom, 3rem))",
            }}
          >
            <p className="text-white/45 uppercase tracking-[0.2em] sm:tracking-[0.25em] text-[10px] sm:text-xs font-bold mb-1.5 sm:mb-2">
              NICE International School
            </p>
            <MH1 className="text-2xl sm:text-4xl font-black text-white leading-tight">
              Выберите кабинет
            </MH1>
          </MD>
        </div>
      </div>

      {/* ── Cabinets grid ── */}
      <section className="relative min-h-screen" style={{ background: "#f2f9f6" }}>
        <div
          className="absolute top-0 left-0 right-0 h-24 sm:h-32 pointer-events-none z-10"
          style={{ background: "linear-gradient(to bottom, rgba(12,36,64,0.4), transparent)" }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 15% 25%, rgba(23,165,137,0.08) 0%, transparent 55%)," +
              "radial-gradient(circle at 85% 70%, rgba(11,111,93,0.06) 0%, transparent 55%)",
          }}
        />

        <div className="relative z-10 container mx-auto px-4 py-16 sm:py-24">
          <div className="text-center mb-10 sm:mb-14">
            <MD
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <p className="uppercase tracking-[0.2em] sm:tracking-[0.25em] text-[10px] sm:text-xs font-black mb-2 sm:mb-3" style={{ color: "#17a589" }}>
                Виртуальный тур
              </p>
              <MH2 className="text-2xl sm:text-4xl md:text-5xl font-black mb-2 sm:mb-3" style={{ color: "#0c2440" }}>
                Наши кабинеты
              </MH2>
              <p className="font-medium text-sm sm:text-base" style={{ color: "#3f5570" }}>
                Нажмите на кабинет, чтобы узнать подробнее
              </p>
            </MD>
          </div>

          {loading && (
            <div className="flex justify-center py-20">
              <div
                className="w-10 h-10 rounded-full border-4 animate-spin"
                style={{ borderColor: "#17a589", borderTopColor: "transparent" }}
              />
            </div>
          )}

          {!loading && cabinets.length === 0 && (
            <div className="text-center py-20 text-slate-400">
              <p className="font-semibold text-lg">Кабинеты пока не добавлены</p>
              <p className="text-sm mt-1">Администратор добавит их в ближайшее время</p>
            </div>
          )}

          {!loading && cabinets.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
              {cabinets.map((cabinet, i) => (
                <MBtn
                  key={cabinet.id}
                  layoutId={`plaque-${cabinet.id}`}
                  onClick={() => setSelectedId(cabinet.id)}
                  className="relative rounded-2xl text-left cursor-pointer overflow-hidden w-full"
                  initial={{ opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ delay: i * 0.07, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  whileHover={{ y: -5, scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  style={{
                    background: `linear-gradient(145deg, ${cabinet.gradFrom}, ${cabinet.gradTo})`,
                    boxShadow: "0 8px 28px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.12)",
                  }}
                >
                  {["top-2.5 left-2.5", "top-2.5 right-2.5", "bottom-2.5 left-2.5", "bottom-2.5 right-2.5"].map((pos) => (
                    <div
                      key={pos}
                      className={`absolute ${pos} w-2 h-2 rounded-full z-10`}
                      style={{
                        background: "rgba(255,255,255,0.35)",
                        boxShadow: "0 0 0 1px rgba(255,255,255,0.15), inset 0 1px 1px rgba(255,255,255,0.3)",
                      }}
                    />
                  ))}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{ background: "linear-gradient(145deg, rgba(255,255,255,0.1) 0%, transparent 50%)" }}
                  />

                  <div className="relative p-5 sm:p-6">
                    <MH3
                      layoutId={`plaque-title-${cabinet.id}`}
                      className="text-white font-black text-base sm:text-lg leading-tight mb-1"
                    >
                      {cabinet.name}
                    </MH3>
                    {cabinet.teacher && (
                      <Link
                        href={`/mentors/${teacherSlug(cabinet.teacher)}`}
                        className="text-white/60 text-xs font-semibold truncate block hover:text-white/90 transition-colors mb-3"
                        onClick={e => e.stopPropagation()}
                      >
                        {cabinet.teacher} →
                      </Link>
                    )}

                    <div className="h-px bg-white/15 mb-3" />

                    <p className="text-white/65 text-xs sm:text-sm leading-relaxed line-clamp-2">
                      {cabinet.description}
                    </p>

                    <div className="mt-4 flex items-center gap-1.5">
                      <span className="text-white/75 text-xs font-bold uppercase tracking-wider">Подробнее</span>
                      <span className="text-white/50 text-xs">→</span>
                    </div>
                  </div>
                </MBtn>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Modal */}
      <AnimatePresence>
        {selectedCabinet && (
          <CabinetModal
            key={selectedCabinet.id}
            cabinet={selectedCabinet}
            onClose={() => setSelectedId(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
