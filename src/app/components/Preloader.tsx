"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";

const DURATION = 2400;
const R = 88;
const CIRCUM = 2 * Math.PI * R;

export default function Preloader() {
  const [progress, setProgress] = useState(0);
  const [fading, setFading] = useState(false);
  const [gone, setGone] = useState(false);
  const rafRef = useRef<number>(0);
  const startRef = useRef<number>(0);

  useEffect(() => {
    const animate = (ts: number) => {
      if (!startRef.current) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const pct = Math.min(Math.floor((elapsed / DURATION) * 100), 100);
      setProgress(pct);
      if (pct < 100) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setTimeout(() => {
          setFading(true);
          setTimeout(() => setGone(true), 700);
        }, 200);
      }
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  if (gone) return null;

  const dashOffset = CIRCUM * (1 - progress / 100);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;600;700&family=IBM+Plex+Mono:wght@300;400&display=swap');
        @keyframes preloader-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes preloader-spin-rev {
          from { transform: rotate(0deg); }
          to   { transform: rotate(-360deg); }
        }
        @keyframes preloader-pulse-ring {
          0%, 100% { opacity: 0.15; }
          50%       { opacity: 0.35; }
        }
      `}</style>

      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          background: "#071A3C",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          opacity: fading ? 0 : 1,
          transition: "opacity 0.7s cubic-bezier(0.4,0,0.2,1)",
          pointerEvents: fading ? "none" : "all",
        }}
      >
        {/* Radial glow behind emblem */}
        <div style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse 55% 45% at 50% 50%, rgba(90,143,255,0.13) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        {/* Emblem + rings */}
        <div style={{ position: "relative", width: 230, height: 230 }}>

          {/* Outermost rotating dashed ring */}
          <div style={{
            position: "absolute",
            inset: -18,
            borderRadius: "50%",
            border: "1px dashed rgba(160,190,255,0.18)",
            animation: "preloader-spin 18s linear infinite",
          }} />

          {/* Second dashed ring — counter-rotate */}
          <div style={{
            position: "absolute",
            inset: -8,
            borderRadius: "50%",
            border: "1px dashed rgba(160,190,255,0.10)",
            animation: "preloader-spin-rev 24s linear infinite",
          }} />

          {/* SVG progress ring */}
          <svg
            width="230"
            height="230"
            viewBox="0 0 200 200"
            style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}
          >
            {/* Track */}
            <circle
              cx="100" cy="100" r={R}
              fill="none"
              stroke="rgba(255,255,255,0.05)"
              strokeWidth="1.5"
            />
            {/* Progress arc */}
            <circle
              cx="100" cy="100" r={R}
              fill="none"
              stroke="url(#preloaderGrad)"
              strokeWidth="1.5"
              strokeDasharray={`${CIRCUM}`}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
            />
            <defs>
              <linearGradient id="preloaderGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%"   stopColor="#5A8FFF" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#A0C4FF" stopOpacity="1" />
              </linearGradient>
            </defs>
          </svg>

          {/* Emblem logo */}
          <div style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <div style={{
              width: 90,
              height: 90,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.04)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              animation: "preloader-pulse-ring 3s ease-in-out infinite",
            }}>
              <Image
                src="/images/logo/ellipse.svg"
                alt="NICE"
                width={64}
                height={64}
                priority
                style={{ opacity: 0.88, filter: "brightness(1.2) saturate(0.9)" }}
              />
            </div>
          </div>
        </div>

        {/* NICE wordmark — staggered letter reveal */}
        <div style={{
          marginTop: 36,
          display: "flex",
          letterSpacing: "0.45em",
          fontFamily: "'Cormorant Garamond', 'Georgia', serif",
          fontSize: 76,
          fontWeight: 300,
          color: "rgba(255,255,255,0.92)",
          userSelect: "none",
        }}>
          {["N","I","C","E"].map((letter, i) => {
            const threshold = (i + 1) * 18;
            const revealed = progress >= threshold;
            return (
              <span
                key={letter}
                style={{
                  display: "inline-block",
                  opacity: revealed ? 1 : 0,
                  transform: revealed ? "translateY(0px)" : "translateY(10px)",
                  transition: "opacity 0.6s ease, transform 0.6s ease",
                }}
              >
                {letter}
              </span>
            );
          })}
        </div>

        {/* Tagline */}
        <div style={{
          marginTop: 8,
          fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
          fontSize: 9,
          letterSpacing: "0.35em",
          color: "rgba(160,190,255,0.35)",
          textTransform: "uppercase",
          opacity: progress >= 30 ? 1 : 0,
          transition: "opacity 0.8s ease",
        }}>
          International School
        </div>

        {/* Progress counter */}
        <div style={{
          position: "absolute",
          bottom: 48,
          left: 0,
          right: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 10,
        }}>
          {/* Progress bar */}
          <div style={{
            width: 140,
            height: 1,
            background: "rgba(255,255,255,0.07)",
            borderRadius: 1,
            overflow: "hidden",
          }}>
            <div style={{
              height: "100%",
              width: `${progress}%`,
              background: "linear-gradient(90deg, #5A8FFF, #A0C4FF)",
              transition: "width 0.05s linear",
            }} />
          </div>

          {/* Percentage number */}
          <div style={{
            fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
            fontSize: 10,
            fontWeight: 300,
            letterSpacing: "0.25em",
            color: "rgba(160,190,255,0.4)",
          }}>
            {String(progress).padStart(3, "0")}%
          </div>
        </div>
      </div>
    </>
  );
}
