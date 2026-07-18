"use client";
import { useRef, useState, useEffect } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import type { MotionValue } from "framer-motion";
import Link from "next/link";
import { GO_API_URL } from "@/utils/apiData";

function teacherSlug(name: string) {
  return encodeURIComponent(name.toLowerCase().replace(/\s+/g, "-"));
}

// framer-motion types don't align with React 19 — same workaround used project-wide
const MD    = motion.div    as any;
const MP    = motion.p      as any;
const MH1   = motion.h1     as any;
const MH2   = motion.h2     as any;
const MH3   = motion.h3     as any;
const MSpan = motion.span   as any;
const MBtn  = motion.button as any;

// ─── Types ────────────────────────────────────────────────────────────────────

interface Cabinet {
  id: number;
  name: string;
  teacher?: string;
  description: string;
  photo: string;
  gradFrom: string;
  gradTo: string;
  icon: string;
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
    icon: c.icon || "🏫",
    gradFrom: c.grad_from || "#7c3aed",
    gradTo: c.grad_to || "#4f46e5",
  };
}

// ─── Door ─────────────────────────────────────────────────────────────────────

function Door({ side, x }: { side: "left" | "right"; x: MotionValue<string> }) {
  const isLeft = side === "left";
  return (
    <div
      className="absolute top-0 h-full w-1/2"
      style={{ left: isLeft ? "0%" : "50%" }}
    >
      <MD className="relative h-full w-full" style={{ x }}>
        <div
          className="relative h-full w-full"
          style={{
            background: isLeft
              ? "linear-gradient(to right, #0a1628 0%, #122040 55%, #1a2d50 100%)"
              : "linear-gradient(to left, #0a1628 0%, #122040 55%, #1a2d50 100%)",
            boxShadow: isLeft
              ? "inset -12px 0 30px rgba(0,0,0,0.9)"
              : "inset 12px 0 30px rgba(0,0,0,0.9)",
          }}
        >
          {/* Upper glass panel */}
          <div
            className="absolute"
            style={{
              left: "8%", right: "8%", top: "6%", height: "44%",
              background: "linear-gradient(160deg, rgba(147,197,253,0.14), rgba(96,165,250,0.06))",
              border: "1px solid rgba(147,197,253,0.22)",
              borderRadius: "2px",
            }}
          />
          {/* Lower glass panel */}
          <div
            className="absolute"
            style={{
              left: "8%", right: "8%", top: "56%", height: "30%",
              background: "linear-gradient(160deg, rgba(147,197,253,0.10), rgba(96,165,250,0.04))",
              border: "1px solid rgba(147,197,253,0.16)",
              borderRadius: "2px",
            }}
          />
          {/* Handle */}
          <div
            className="absolute"
            style={{
              top: "43%",
              left: isLeft ? "72%" : "22%",
              width: "8%", height: "16%",
              background: "linear-gradient(180deg, #bfdbfe 0%, #93c5fd 40%, #60a5fa 100%)",
              borderRadius: "3px",
              boxShadow: "0 2px 10px rgba(59,130,246,0.55)",
            }}
          />
          {/* Inner edge accent */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              boxShadow: isLeft
                ? "inset -4px 0 0 rgba(124,58,237,0.28)"
                : "inset 4px 0 0 rgba(124,58,237,0.28)",
            }}
          />
        </div>
      </MD>
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function CabinetModal({ cabinet, onClose }: { cabinet: Cabinet; onClose: () => void }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <MD
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/70" style={{ backdropFilter: "blur(6px)" }} />

      <MD
        layoutId={`plaque-${cabinet.id}`}
        className="relative z-10 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl bg-white"
        transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        {/* Photo */}
        <div
          className="relative aspect-video flex items-center justify-center overflow-hidden"
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
            style={{
              background: "radial-gradient(ellipse at 30% 40%, rgba(255,255,255,0.12) 0%, transparent 55%)",
            }}
          />
          <MSpan
            className="relative z-10 text-7xl sm:text-8xl drop-shadow-2xl"
            initial={{ scale: 0.75, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.4 }}
          >
            {cabinet.icon}
          </MSpan>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-7">
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
                style={{ color: "#7c3aed" }}
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

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    fetch(`${GO_API_URL}/api/school-cabinets`)
      .then(r => r.ok ? r.json() : [])
      .then((data: ApiCabinet[]) => setCabinets(Array.isArray(data) ? data.map(mapCabinet) : []))
      .catch(() => setCabinets([]))
      .finally(() => setLoading(false));
  }, []);

  const { scrollYProgress } = useScroll({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    target: containerRef as any,
    offset: ["start start", "end start"],
  });

  const leftDoorX       = useTransform(scrollYProgress, [0, 0.45], ["0%", "-110%"]);
  const rightDoorX      = useTransform(scrollYProgress, [0, 0.45], ["0%", "110%"]);
  const sceneScale      = useTransform(scrollYProgress, [0, 0.75], [1, 1.9]);
  const interiorOpacity = useTransform(scrollYProgress, [0.15, 0.55], [0, 1]);
  const hintOpacity     = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const titleOpacity    = useTransform(scrollYProgress, [0.6, 0.95], [0, 1]);
  const titleY          = useTransform(scrollYProgress, [0.6, 0.95], [40, 0]);

  const selectedCabinet = cabinets.find((c) => c.id === selectedId) ?? null;

  return (
    <>
      {/* ── Scroll scene 250vh ── */}
      <div ref={containerRef} style={{ height: "250vh" }}>
        <div className="sticky top-0 h-screen w-full overflow-hidden bg-slate-950">

          {/* Aspect-ratio-locked container — keeps door coords consistent on any viewport */}
          <MD
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{
              width:  "max(100vw, calc(100vh * 1920 / 1280))",
              height: "max(100vh, calc(100vw * 1280 / 1920))",
              scale: sceneScale,
              // Points at the center of the door opening.
              // Adjust X% to match horizontal position of entrance in your facade image.
              transformOrigin: "46% 70%",
            }}
          >
            {/* Facade */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/school/facade.jpg"
              alt="NICE International School"
              className="absolute inset-0 w-full h-full object-cover select-none"
              draggable={false}
            />
            {/* Fallback bg */}
            <div
              className="absolute inset-0 -z-10"
              style={{ background: "linear-gradient(180deg, #0f172a, #1e293b 60%, #0f172a)" }}
            />
            {/* Vignette */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(0,0,0,0.5) 100%)",
              }}
            />

            {/* ── DOOR OPENING ──
                Coordinates match the school facade render (central glass entrance).
                Adjust left/top/width/height if you swap the facade image. */}
            <div
              className="absolute overflow-hidden"
              style={{ left: "42.5%", top: "57%", width: "7%", height: "26%" }}
            >
              {/* Interior */}
              <MD className="absolute inset-0" style={{ opacity: interiorOpacity }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/school/interior.jpg"
                  alt="Интерьер"
                  className="absolute inset-0 w-full h-full object-cover"
                  draggable={false}
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(to bottom, rgba(15,23,42,0.95) 0%, rgba(30,50,90,0.65) 45%, rgba(60,90,150,0.35) 100%)",
                  }}
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "radial-gradient(ellipse at 50% 85%, rgba(147,197,253,0.3) 0%, transparent 70%)",
                  }}
                />
              </MD>

              <Door side="left"  x={leftDoorX}  />
              <Door side="right" x={rightDoorX} />
            </div>
          </MD>

          {/* Scroll hint */}
          {mounted && (
            <MD
              className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none"
              style={{ opacity: hintOpacity }}
            >
              <MD
                className="flex flex-col items-center gap-2"
                animate={{ y: [0, 9, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <p className="text-white/55 text-sm font-bold tracking-wider">
                  Прокрутите вниз
                </p>
                <div className="w-6 h-9 rounded-full border-2 border-white/25 flex justify-center pt-1.5">
                  <div className="w-1 h-2 rounded-full bg-white/50" />
                </div>
              </MD>
            </MD>
          )}

          {/* Section title shown at end of scroll */}
          <MD
            className="absolute bottom-12 left-0 right-0 text-center pointer-events-none"
            style={{ opacity: titleOpacity, y: titleY }}
          >
            <p className="text-white/45 uppercase tracking-[0.25em] text-xs font-bold mb-2">
              NICE International School
            </p>
            <MH1 className="text-2xl sm:text-4xl font-black text-white">Выберите кабинет</MH1>
          </MD>
        </div>
      </div>

      {/* ── Cabinets grid ── */}
      <section className="relative min-h-screen" style={{ background: "#f0f4ff" }}>
        {/* Top fade */}
        <div
          className="absolute top-0 left-0 right-0 h-32 pointer-events-none z-10"
          style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.35), transparent)" }}
        />
        {/* Texture */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 15% 25%, rgba(124,58,237,0.07) 0%, transparent 55%)," +
              "radial-gradient(circle at 85% 70%, rgba(14,165,233,0.07) 0%, transparent 55%)",
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none opacity-40"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(124,58,237,0.05) 1px, transparent 1px)",
            backgroundSize: "30px 30px",
          }}
        />

        <div className="relative z-10 container mx-auto px-4 py-20 sm:py-24">
          {/* Header */}
          <div className="text-center mb-12 sm:mb-14">
            <MD
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <p className="uppercase tracking-[0.25em] text-xs font-black mb-3" style={{ color: "#7c3aed" }}>
                Виртуальный тур
              </p>
              <MH2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 mb-3">
                Наши кабинеты
              </MH2>
              <p className="text-slate-500 font-medium text-sm sm:text-base">
                Нажмите на кабинет, чтобы узнать подробнее
              </p>
            </MD>
          </div>

          {/* Plaque grid */}
          {loading && (
            <div className="flex justify-center py-20">
              <div className="w-10 h-10 rounded-full border-4 border-violet-600 border-t-transparent animate-spin" />
            </div>
          )}
          {!loading && cabinets.length === 0 && (
            <div className="text-center py-20 text-slate-400">
              <p className="text-5xl mb-4">🏫</p>
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
                className="relative rounded-2xl text-left cursor-pointer overflow-hidden"
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: i * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -6, scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                style={{
                  background: `linear-gradient(145deg, ${cabinet.gradFrom}, ${cabinet.gradTo})`,
                  boxShadow:
                    "0 8px 28px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.12)",
                }}
              >
                {/* Corner screws */}
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
                {/* Sheen */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{ background: "linear-gradient(145deg, rgba(255,255,255,0.1) 0%, transparent 50%)" }}
                />

                <div className="relative p-5 sm:p-6">
                  <div className="flex items-start gap-3 mb-3">
                    <span className="text-3xl flex-shrink-0 drop-shadow">{cabinet.icon}</span>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <MH3
                        layoutId={`plaque-title-${cabinet.id}`}
                        className="text-white font-black text-base sm:text-lg leading-tight"
                      >
                        {cabinet.name}
                      </MH3>
                      {cabinet.teacher && (
                        <Link
                          href={`/mentors/${teacherSlug(cabinet.teacher)}`}
                          className="text-white/60 text-xs font-semibold mt-0.5 truncate block hover:text-white/90 transition-colors"
                          onClick={e => e.stopPropagation()}
                        >
                          {cabinet.teacher} →
                        </Link>
                      )}
                    </div>
                  </div>

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
