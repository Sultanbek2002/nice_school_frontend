import React from "react";

interface Event {
  title: string;
  date: string;
  description: string;
  image: string;
}

export default function EventsGrid({ data }: { data: any }) {
  const events: Event[] = Array.isArray(data) ? data : [];

  if (!events.length) return null;

  return (
    <section className="py-14 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((ev, i) => (
            <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
              {ev.image && (
                <div className="h-48 overflow-hidden">
                  <img
                    src={ev.image}
                    alt={ev.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              )}
              <div className="p-5">
                {ev.date && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold mb-3">
                    📅 {new Date(ev.date).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}
                  </div>
                )}
                <h3 className="font-bold text-slate-800 text-lg leading-snug mb-2 group-hover:text-emerald-700 transition-colors">
                  {ev.title}
                </h3>
                {ev.description && (
                  <p className="text-slate-500 text-sm line-clamp-3">{ev.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
