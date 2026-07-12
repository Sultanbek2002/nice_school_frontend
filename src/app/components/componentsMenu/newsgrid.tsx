"use client";
import React, { useState } from "react";

interface NewsItem {
  title: string;
  description: string;
  date: string;
  image: string;
  video: string;
  category: string;
}

interface BlockData {
  section_title?: string;
  items?: NewsItem[];
}

function formatDate(d: string) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
}

function VideoModal({ url, onClose }: { url: string; onClose: () => void }) {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
  const embedUrl = match ? `https://www.youtube.com/embed/${match[1]}?autoplay=1` : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <div className="w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
        {embedUrl ? (
          <div className="aspect-video rounded-2xl overflow-hidden">
            <iframe src={embedUrl} className="w-full h-full" allowFullScreen title="video" />
          </div>
        ) : (
          <video src={url} controls autoPlay className="w-full rounded-2xl" />
        )}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white text-3xl font-light hover:opacity-70"
        >✕</button>
      </div>
    </div>
  );
}

export default function NewsGrid({ data }: { data: any }) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  let sectionTitle = "Новости";
  let items: NewsItem[] = [];

  if (data && !Array.isArray(data) && data.items) {
    sectionTitle = data.section_title || sectionTitle;
    items = Array.isArray(data.items) ? data.items : [];
  } else if (Array.isArray(data)) {
    items = data;
  }

  if (!items.length) return null;

  const featured = items[0];
  const secondary = items.slice(1, 4);
  const rest = items.slice(4);

  return (
    <section className="py-14 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Section title */}
        <h2 className="text-3xl font-black text-slate-800 mb-8">{sectionTitle}</h2>

        {/* Main magazine grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 mb-6">
          {/* Featured big card — left 3 cols */}
          <div className="lg:col-span-3 bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300 flex flex-col sm:flex-row min-h-[260px]">
            {featured.image && (
              <div className="sm:w-2/5 flex-shrink-0 relative overflow-hidden min-h-[200px]">
                <img
                  src={featured.image}
                  alt={featured.title}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
            )}
            <div className="flex-1 p-6 flex flex-col justify-between">
              <div>
                {featured.category && (
                  <span className="inline-block text-xs font-bold uppercase tracking-wider text-teal-600 mb-2">
                    {featured.category}
                  </span>
                )}
                {featured.date && (
                  <div className="flex items-center gap-1.5 text-sm text-slate-400 mb-3">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {formatDate(featured.date)}
                  </div>
                )}
                <h3 className="text-xl font-bold text-slate-800 leading-snug mb-3">
                  {featured.title}
                </h3>
                {featured.description && (
                  <p className="text-slate-500 text-sm line-clamp-4">{featured.description}</p>
                )}
              </div>
              {featured.video && (
                <button
                  onClick={() => setVideoUrl(featured.video)}
                  className="mt-4 inline-flex items-center gap-2 text-teal-600 font-semibold text-sm hover:text-teal-700 transition-colors self-start"
                >
                  <span className="w-7 h-7 bg-teal-50 rounded-full flex items-center justify-center">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </span>
                  Смотреть видео
                </button>
              )}
              {!featured.video && (
                <span className="mt-4 inline-flex items-center gap-1 text-teal-600 font-semibold text-sm self-start">
                  Подробнее
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              )}
            </div>
          </div>

          {/* Secondary small cards — right 2 cols */}
          {secondary.length > 0 && (
            <div className="lg:col-span-2 flex flex-col gap-4">
              {secondary.map((item, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 flex items-stretch"
                >
                  {item.image && (
                    <div className="w-20 flex-shrink-0 relative">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 p-3.5 flex flex-col justify-center">
                    {item.category && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600 mb-0.5">
                        {item.category}
                      </span>
                    )}
                    <h4 className="font-semibold text-slate-800 text-sm leading-snug line-clamp-2">
                      {item.title}
                    </h4>
                    {item.date && (
                      <p className="text-xs text-slate-400 mt-1">{formatDate(item.date)}</p>
                    )}
                    {item.video && (
                      <button
                        onClick={() => setVideoUrl(item.video)}
                        className="mt-1 text-xs text-teal-600 font-medium text-left"
                      >
                        ▶ Видео
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Extra items — regular grid */}
        {rest.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {rest.map((item, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300"
              >
                {item.image && (
                  <div className="h-44 overflow-hidden">
                    <img src={item.image} alt={item.title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                  </div>
                )}
                <div className="p-4">
                  {item.category && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600 mb-1 block">
                      {item.category}
                    </span>
                  )}
                  <h4 className="font-bold text-slate-800 line-clamp-2 mb-1">{item.title}</h4>
                  {item.date && <p className="text-xs text-slate-400">{formatDate(item.date)}</p>}
                  {item.description && (
                    <p className="text-slate-500 text-sm mt-2 line-clamp-2">{item.description}</p>
                  )}
                  {item.video && (
                    <button
                      onClick={() => setVideoUrl(item.video)}
                      className="mt-2 text-xs text-teal-600 font-semibold"
                    >
                      ▶ Видео
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {videoUrl && <VideoModal url={videoUrl} onClose={() => setVideoUrl(null)} />}
    </section>
  );
}
