"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { GO_API_URL } from "@/utils/apiData";

export default function LiveTestHomePage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const join = async () => {
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length !== 6) { setError("Код состоит из 6 символов"); return; }
    setJoining(true);
    setError("");
    try {
      const res = await fetch(`${GO_API_URL}/api/live-test/${trimmed}`);
      if (!res.ok) { setError("Тест не найден"); return; }
      const { test } = await res.json();
      router.push(test.status === "finished" ? `/test/${trimmed}/results` : `/test/${trimmed}/lobby`);
    } catch {
      setError("Ошибка соединения");
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-gray px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-4xl">

        {/* Hero */}
        <div className="mb-8 text-center">
          <h1 className="mb-1 text-3xl sm:text-4xl font-extrabold text-midnight_text">Live Test</h1>
          <p className="text-sm text-grey">Интерактивный тест в реальном времени</p>
        </div>

        {/* Code entry */}
        <div className="glass-card mx-auto max-w-sm rounded-2xl p-5">
          <p className="mb-3 text-center text-sm font-semibold text-midnight_text">Введите код</p>
          <div className="flex gap-2">
            <input
              ref={inputRef}
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && join()}
              maxLength={6}
              placeholder="ABC123"
              className="min-w-0 flex-1 rounded-xl border border-black/10 bg-white/80 px-3 py-3 text-center text-xl font-bold tracking-[0.3em] text-midnight_text uppercase placeholder:text-gray-300 focus:border-primary focus:outline-none"
            />
            <button
              onClick={join}
              disabled={joining || code.length !== 6}
              className="shrink-0 rounded-xl bg-primary px-4 py-3 font-bold text-white disabled:opacity-50 transition-all active:scale-95"
            >
              {joining ? "..." : "Войти"}
            </button>
          </div>
          {error && <p className="mt-2 text-center text-sm text-red-500">{error}</p>}
        </div>
      </div>
    </div>
  );
}
