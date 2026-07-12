"use client";
import React, { useState } from "react";

interface Photo {
  url: string;
  caption: string;
}

export default function PhotoGallery({ data }: { data: any }) {
  const photos: Photo[] = Array.isArray(data) ? data : [];
  const [selected, setSelected] = useState<Photo | null>(null);

  if (!photos.length) return null;

  return (
    <section className="py-14 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="columns-2 sm:columns-3 lg:columns-4 gap-3 space-y-3">
          {photos.map((p, i) => (
            <div
              key={i}
              className="break-inside-avoid cursor-pointer group relative overflow-hidden rounded-xl"
              onClick={() => setSelected(p)}
            >
              <img
                src={p.url}
                alt={p.caption}
                className="w-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              {p.caption && (
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-end">
                  <p className="text-white text-sm font-medium p-3 translate-y-4 group-hover:translate-y-0 transition-transform opacity-0 group-hover:opacity-100">
                    {p.caption}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setSelected(null)}
        >
          <div className="max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            <img src={selected.url} alt={selected.caption} className="w-full max-h-[80vh] object-contain rounded-xl" />
            {selected.caption && (
              <p className="text-white text-center mt-3 text-sm">{selected.caption}</p>
            )}
            <button
              onClick={() => setSelected(null)}
              className="absolute top-4 right-4 text-white text-3xl font-light hover:opacity-70"
            >✕</button>
          </div>
        </div>
      )}
    </section>
  );
}
