"use client";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

// framer-motion types don't align with React 19 — same workaround used project-wide
const MD   = motion.div    as any;
const MP   = motion.p      as any;
const MH1  = motion.h1     as any;
const MBtn = motion.button as any;

const STATS = [
  { emoji: "🏫", label: "6 кабинетов" },
  { emoji: "👨‍🏫", label: "Опытные преподаватели" },
  { emoji: "🔬", label: "Современное оборудование" },
  { emoji: "🏆", label: "Международный стандарт" },
];

export default function SchoolTourLanding() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950">
      {/* School facade */}
      <div className="absolute inset-0">
        <Image
          src="/images/school/facade.jpg"
          alt="NICE International School — главный вход"
          fill
          className="object-cover object-center"
          priority
          sizes="100vw"
        />
        {/* Fallback gradient when image is missing */}
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(160deg, #0f172a 0%, #1e1b4b 40%, #0c1a2e 100%)" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/30 to-black/80" />
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.12) 0%, rgba(14,165,233,0.08) 100%)" }}
        />
      </div>

      {/* Dot grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)",
          backgroundSize: "36px 36px",
        }}
      />

      {/* Hero */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center text-center px-4 pb-28 pt-32">
        {/* School badge */}
        <MD
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center gap-3 mb-8 px-5 py-2.5 rounded-full"
          style={{
            background: "rgba(255,255,255,0.1)",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(255,255,255,0.18)",
          }}
        >
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-white"
            style={{ background: "linear-gradient(135deg, #7c3aed, #0ea5e9)" }}
          >
            N
          </div>
          <span className="text-white/90 uppercase tracking-[0.22em] text-xs font-black">
            NICE International School
          </span>
        </MD>

        <MH1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white leading-[1.05] mb-5 max-w-3xl"
        >
          Виртуальный тур<br />
          <span
            className="text-transparent bg-clip-text"
            style={{ backgroundImage: "linear-gradient(135deg, #a78bfa, #38bdf8)" }}
          >
            по нашей школе
          </span>
        </MH1>

        <MP
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.7 }}
          className="text-white/65 text-base sm:text-lg md:text-xl max-w-md mx-auto mb-10 leading-relaxed font-medium"
        >
          Откройте двери и познакомьтесь с нашими кабинетами, лабораториями и пространствами для обучения
        </MP>

        <MD
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.6 }}
        >
          <Link href="/school-tour/cabinets">
            <MBtn
              whileHover={{ scale: 1.05, boxShadow: "0 20px 50px rgba(124,58,237,0.55)" }}
              whileTap={{ scale: 0.97 }}
              className="px-10 sm:px-12 py-4 rounded-full text-white font-black text-base sm:text-lg shadow-2xl"
              style={{
                background: "linear-gradient(135deg, #7c3aed, #0ea5e9)",
                boxShadow: "0 10px 40px rgba(124,58,237,0.45)",
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
            transition={{ delay: 1.2 }}
            className="absolute bottom-32 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          >
            <MD
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.6, repeat: Infinity }}
              className="w-6 h-9 rounded-full border-2 border-white/30 flex justify-center pt-1.5"
            >
              <div className="w-1 h-2 rounded-full bg-white/60" />
            </MD>
          </MD>
        )}
      </div>

      {/* Bottom stats strip */}
      <MD
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.7 }}
        className="absolute bottom-0 left-0 right-0 z-10"
        style={{
          background: "rgba(0,0,0,0.55)",
          backdropFilter: "blur(16px)",
          borderTop: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div className="flex items-center justify-center gap-4 sm:gap-8 md:gap-12 flex-wrap px-4 py-4 sm:py-5">
          {STATS.map(({ emoji, label }) => (
            <div key={label} className="flex items-center gap-2 text-white/80">
              <span className="text-lg sm:text-xl">{emoji}</span>
              <span className="text-xs sm:text-sm font-bold">{label}</span>
            </div>
          ))}
        </div>
      </MD>
    </main>
  );
}
