"use client";
import { useState, useRef, useEffect } from "react";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

const LANGS: { code: Locale; label: string }[] = [
  { code: "ru", label: "РУС" },
  { code: "ky", label: "КЫР" },
  { code: "en", label: "ENG" },
];

export default function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const current = LANGS.find((l) => l.code === locale) ?? LANGS[0];

  const switchTo = (next: Locale) => {
    setOpen(false);
    if (next === locale) return;
    router.replace(pathname, { locale: next });
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-midnight_text hover:border-primary/40 transition-colors"
        aria-label="Язык / Тил / Language"
      >
        {current.label}
        <svg className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-24 overflow-hidden rounded-xl border border-slate-100 bg-white shadow-lg z-50">
          {LANGS.map((l) => (
            <button
              key={l.code}
              onClick={() => switchTo(l.code)}
              className={`block w-full px-3 py-2 text-left text-xs font-semibold transition-colors ${
                l.code === locale ? "bg-primary/10 text-primary" : "text-midnight_text hover:bg-slate-50"
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
