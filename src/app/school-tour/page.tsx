"use client";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { GO_API_URL } from "@/utils/apiData";

const MD   = motion.div    as any;
const MP   = motion.p      as any;
const MH1  = motion.h1     as any;
const MBtn = motion.button as any;

const STATS = [
  { label: "Кабинеты",     value: "6+" },
  { label: "Преподаватели", value: "20+" },
  { label: "Стандарт",     value: "IB" },
  { label: "Учеников",     value: "500+" },
];

export default function SchoolTourLanding() {
  const [mounted, setMounted] = useState(false);
  const [facadePhoto, setFacadePhoto] = useState("");

  useEffect(() => {
    setMounted(true);
    fetch(`${GO_API_URL}/api/school-tour-settings`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.facade_photo) setFacadePhoto(d.facade_photo); })
      .catch(() => {});
  }, []);

  return (
    <main className="relative min-h-[100dvh] overflow-hidden flex flex-col">

      {/* ── Фоновое фото ── */}
      <div className="absolute inset-0 z-0">
        {facadePhoto ? (
          <Image
            src={facadePhoto}
            alt="NICE International School"
            fill
            className="object-cover object-center"
            priority
            sizes="100vw"
          />
        ) : (
          <div className="absolute inset-0" style={{ background: "linear-gradient(160deg, #0c2440 0%, #0b6f5d 60%, #17a589 100%)" }} />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/40 to-black/80" />
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(135deg, rgba(11,111,93,0.35) 0%, rgba(23,165,137,0.12) 50%, transparent 100%)" }}
        />
      </div>

      {/* Dot pattern */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* Teal glow */}
      <div
        className="absolute -top-24 -left-24 w-[360px] h-[360px] rounded-full pointer-events-none z-0"
        style={{ background: "radial-gradient(ellipse, rgba(23,165,137,0.2) 0%, transparent 65%)", filter: "blur(40px)" }}
      />

      {/* ── Hero ── */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-5 pt-28 pb-40 sm:pt-36 sm:pb-44">

        {/* Бейдж */}
        <MD
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="inline-flex items-center gap-2 mb-6 sm:mb-8 px-4 py-2 sm:px-5 sm:py-2.5 rounded-full"
          style={{
            background: "rgba(23,165,137,0.18)",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(23,165,137,0.4)",
          }}
        >
          <div
            className="w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[9px] sm:text-[10px] font-black text-white flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #17a589, #0b6f5d)" }}
          >
            N
          </div>
          <span className="text-white/90 uppercase tracking-[0.18em] sm:tracking-[0.22em] text-[10px] sm:text-[11px] font-black">
            NICE International School
          </span>
        </MD>

        {/* Заголовок */}
        <MH1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
          className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white leading-[1.06] mb-4 sm:mb-5 max-w-3xl"
        >
          Виртуальный тур<br />
          <span
            className="text-transparent bg-clip-text"
            style={{ backgroundImage: "linear-gradient(135deg, #5eead4, #34d399)" }}
          >
            по нашей школе
          </span>
        </MH1>

        {/* Подзаголовок */}
        <MP
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.28, duration: 0.7 }}
          className="text-white/65 text-sm sm:text-base md:text-lg max-w-xs sm:max-w-md mx-auto mb-8 sm:mb-10 leading-relaxed font-medium"
        >
          Познакомьтесь с нашими кабинетами, лабораториями и пространствами для обучения
        </MP>

        {/* CTA */}
        <MD
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.42, duration: 0.6 }}
        >
          <Link href="/school-tour/cabinets">
            <MBtn
              whileHover={{ scale: 1.05, boxShadow: "0 20px 50px rgba(23,165,137,0.55)" }}
              whileTap={{ scale: 0.96 }}
              className="px-8 sm:px-12 py-3.5 sm:py-4 rounded-full text-white font-black text-sm sm:text-base md:text-lg shadow-2xl"
              style={{
                background: "linear-gradient(135deg, #17a589, #0b6f5d)",
                boxShadow: "0 10px 40px rgba(23,165,137,0.45)",
              }}
            >
              Войти в школу →
            </MBtn>
          </Link>
        </MD>

        {/* Scroll indicator */}
        {mounted && (
          <MD
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1 }}
            className="absolute bottom-28 sm:bottom-32 left-1/2 -translate-x-1/2"
          >
            <MD
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.6, repeat: Infinity }}
              className="w-5 h-8 sm:w-6 sm:h-9 rounded-full border-2 border-white/30 flex justify-center pt-1.5"
            >
              <div className="w-1 h-1.5 sm:h-2 rounded-full bg-white/60" />
            </MD>
          </MD>
        )}
      </div>

      {/* ── Stats strip ── */}
      <MD
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.65, duration: 0.7 }}
        className="absolute bottom-0 left-0 right-0 z-10"
        style={{
          background: "rgba(12,36,64,0.75)",
          backdropFilter: "blur(18px)",
          borderTop: "1px solid rgba(23,165,137,0.25)",
        }}
      >
        {/* Mobile: 2x2 grid  |  Desktop: horizontal row */}
        <div className="grid grid-cols-2 sm:flex sm:items-stretch sm:justify-center sm:divide-x divide-white/10 px-4 py-4 sm:py-5 gap-px sm:gap-0">
          {STATS.map(({ label, value }) => (
            <div key={label} className="flex flex-col items-center justify-center py-2 sm:px-8 sm:py-1 border-r border-white/10 last:border-r-0 even:border-r-0 sm:border-r-0">
              <span className="text-xl sm:text-2xl md:text-3xl font-black" style={{ color: "#17a589" }}>
                {value}
              </span>
              <span className="text-white/55 text-[10px] sm:text-xs font-semibold mt-0.5 uppercase tracking-wider text-center">
                {label}
              </span>
            </div>
          ))}
        </div>
      </MD>
    </main>
  );
}
