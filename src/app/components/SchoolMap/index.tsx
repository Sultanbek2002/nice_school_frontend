"use client";
import React, { useState } from "react";

const SCHOOL_NAME = "NICE International School";
const SCHOOL_ADDRESS = "Малабекова 56/1, Ош, Кыргызстан";
const SCHOOL_LAT = 40.503572;
const SCHOOL_LNG = 72.7069621;

export default function SchoolMap() {
  const [navigating, setNavigating] = useState(false);

  const openDirections = () => {
    setNavigating(true);

    const launch = (origin?: string) => {
      const dest = `${SCHOOL_LAT},${SCHOOL_LNG}`;
      const url = origin
        ? `https://www.google.com/maps/dir/${origin}/${dest}`
        : `https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=driving`;
      window.open(url, "_blank");
      setNavigating(false);
    };

    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => launch(`${pos.coords.latitude},${pos.coords.longitude}`),
        () => launch(),
        { timeout: 5000 }
      );
    } else {
      launch();
    }
  };

  return (
    <section className="py-6 pb-16">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <div className="mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800">Бизди табыңыз</h2>
          <p className="text-slate-500 text-sm mt-1">Картага басыңыз — мектепке маршрут автоматтык түрдө ачылат</p>
        </div>

        {/* Map card */}
        <div
          className="relative rounded-3xl overflow-hidden shadow-2xl cursor-pointer group"
          onClick={openDirections}
          role="button"
          aria-label="Мектепке маршрут түзүү"
        >
          {/* Map iframe — pointer-events-none so parent gets the click */}
          <iframe
            src={`https://maps.google.com/maps?q=${SCHOOL_LAT},${SCHOOL_LNG}&output=embed&hl=ru&z=17`}
            className="w-full h-[380px] md:h-[480px] pointer-events-none select-none"
            loading="lazy"
            title="Мектептин жайгашкан жери"
            referrerPolicy="no-referrer-when-downgrade"
          />

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />

          {/* Top hint badge */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg flex items-center gap-2 group-hover:scale-105 transition-transform duration-300">
            <svg className="w-4 h-4 text-teal-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
            </svg>
            <span className="text-sm font-semibold text-slate-700 whitespace-nowrap">
              {navigating ? "Жайгашкан жерди аныктоо..." : "Басып маршрут ачыңыз"}
            </span>
            {navigating && (
              <div className="w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
            )}
          </div>

          {/* Bottom info bar */}
          <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md px-5 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              {/* Pin icon */}
              <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-teal-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
              </div>
              <div className="min-w-0">
                <p className="font-bold text-slate-800 text-sm truncate">{SCHOOL_NAME}</p>
                <p className="text-slate-500 text-xs truncate">{SCHOOL_ADDRESS}</p>
              </div>
            </div>

            {/* Navigate button */}
            <button
              className="flex-shrink-0 bg-teal-500 hover:bg-teal-600 text-white px-5 py-2.5 rounded-2xl font-semibold text-sm flex items-center gap-2 transition-colors shadow-md shadow-teal-200 active:scale-95 duration-150"
              onClick={(e) => { e.stopPropagation(); openDirections(); }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              Маршрут
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
