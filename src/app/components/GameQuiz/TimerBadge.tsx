"use client";
import { useEffect, useState } from "react";

export default function TimerBadge({
  seconds,
  resetKey,
}: {
  seconds: number;
  resetKey: string | number;
}) {
  const [left, setLeft] = useState(seconds);

  useEffect(() => {
    setLeft(seconds);
    const start = Date.now();
    const id = setInterval(() => {
      const elapsed = Math.floor((Date.now() - start) / 1000);
      setLeft(Math.max(0, seconds - elapsed));
    }, 250);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seconds, resetKey]);

  const urgent = left <= 5;
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 font-semibold ${
        urgent ? "animate-pulse bg-red-100 text-red-600" : "bg-primary/10 text-primary"
      }`}
    >
      ⏱ {left}с
    </div>
  );
}
