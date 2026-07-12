"use client";
import React, { useState } from "react";

interface Props {
  gameUrl: string;
  title: string;
  gameType: string;
}

export default function GamePlayer({ gameUrl, title, gameType }: Props) {
  const [started, setStarted] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setFullscreen(true);
    } else {
      document.exitFullscreen();
      setFullscreen(false);
    }
  };

  React.useEffect(() => {
    const handler = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  if (!gameUrl) {
    return (
      <div className="w-full h-[400px] flex items-center justify-center bg-slate-900 text-slate-400">
        <div className="text-center">
          <div className="text-5xl mb-3">🔧</div>
          <p>Оюн файлы жок</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full bg-slate-900" style={{ height: fullscreen ? "100vh" : "70vh" }}>
      {/* Start screen */}
      {!started && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900">
          <div className="text-6xl mb-4">🎮</div>
          <h2 className="text-white text-2xl font-black mb-2">{title}</h2>
          <p className="text-slate-400 text-sm mb-8">Оюнду баштоо үчүн басыңыз</p>
          <button
            onClick={() => setStarted(true)}
            className="bg-teal-500 hover:bg-teal-400 text-white px-10 py-4 rounded-2xl font-black text-lg shadow-xl shadow-teal-900/50 transition-all active:scale-95 flex items-center gap-3"
          >
            <span className="text-2xl">▶</span>
            Ойноону баштоо
          </button>
        </div>
      )}

      {/* Iframe */}
      {started && (
        <>
          <iframe
            src={gameUrl}
            className="w-full h-full border-0"
            allow="fullscreen; autoplay; microphone; camera"
            allowFullScreen
            title={title}
          />
          {/* Controls bar */}
          <div className="absolute bottom-3 right-3 flex gap-2">
            <button
              onClick={toggleFullscreen}
              className="bg-black/60 hover:bg-black/80 text-white px-3 py-2 rounded-xl text-xs font-semibold backdrop-blur-sm transition-colors flex items-center gap-1.5"
            >
              {fullscreen ? (
                <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>Кичирейтүү</>
              ) : (
                <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>Толук экран</>
              )}
            </button>
            <button
              onClick={() => setStarted(false)}
              className="bg-black/60 hover:bg-red-600 text-white px-3 py-2 rounded-xl text-xs font-semibold backdrop-blur-sm transition-colors"
            >
              ✕ Токтотуу
            </button>
          </div>
        </>
      )}
    </div>
  );
}
