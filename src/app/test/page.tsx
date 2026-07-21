"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Cookies from "js-cookie";
import { GO_API_URL } from "@/utils/apiData";

interface LiveTest {
  ID: number;
  code: string;
  title: string;
  description: string;
  status: string;
}

const STATUS_LABEL: Record<string, string> = {
  draft: "Черновик", waiting: "Ожидает", live: "Идёт", finished: "Завершён",
};
const STATUS_COLOR: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  waiting: "bg-yellow-100 text-yellow-700",
  live: "bg-green-100 text-green-700",
  finished: "bg-slate-100 text-slate-500",
};

export default function LiveTestHomePage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [myTests, setMyTests] = useState<LiveTest[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const token = Cookies.get("auth_token");
    if (!token) return;
    setIsLoggedIn(true);
    fetch(`${GO_API_URL}/api/live-tests/my`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => setMyTests(Array.isArray(data) ? data.slice(0, 6) : []))
      .catch(() => {});
  }, []);

  const join = async () => {
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length !== 6) { setError("Код 6 символдон турат"); return; }
    setJoining(true);
    setError("");
    try {
      const res = await fetch(`${GO_API_URL}/api/live-test/${trimmed}`);
      if (!res.ok) { setError("Тест табылган жок"); return; }
      const { test } = await res.json();
      router.push(test.status === "finished" ? `/test/${trimmed}/results` : `/test/${trimmed}/lobby`);
    } catch {
      setError("Байланыш катасы");
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-gray px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-4xl">

        {/* Hero */}
        <div className="mb-8 text-center">
          <div className="mb-2 text-5xl sm:text-6xl">🎮</div>
          <h1 className="mb-1 text-3xl sm:text-4xl font-extrabold text-midnight_text">Live Test</h1>
          <p className="text-sm text-grey">Интерактивдүү тест — реалдуу убакыт режиминде</p>
        </div>

        {/* Code entry */}
        <div className="glass-card mx-auto mb-6 max-w-sm rounded-2xl p-5">
          <p className="mb-3 text-center text-sm font-semibold text-midnight_text">Кодду киргизүү</p>
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
              {joining ? "..." : "Кирүү"}
            </button>
          </div>
          {error && <p className="mt-2 text-center text-sm text-red-500">{error}</p>}
        </div>

        {/* Auth actions */}
        {isLoggedIn ? (
          <div className="mb-8 flex justify-center gap-3">
            <Link href="/test/create" className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white hover:bg-primary/90 active:scale-95 transition-all">
              + Тест түзүү
            </Link>
            <Link href="/test/my" className="rounded-xl border border-primary/30 bg-white/60 px-5 py-3 text-sm font-semibold text-primary hover:bg-white/90 active:scale-95 transition-all">
              Менин тесттерим
            </Link>
          </div>
        ) : (
          <div className="mb-8 text-center">
            <p className="text-sm text-grey">
              Тест түзүү үчүн{" "}
              <Link href="/student" className="font-semibold text-primary hover:underline">кирүү керек</Link>
            </p>
          </div>
        )}

        {/* My recent tests */}
        {myTests.length > 0 && (
          <div>
            <h2 className="mb-3 text-base font-bold text-midnight_text">Акыркы тесттерим</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {myTests.map((t) => (
                <div key={t.ID} className="glass-card rounded-xl p-4">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <h3 className="text-sm font-bold text-midnight_text line-clamp-2">{t.title}</h3>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COLOR[t.status] || STATUS_COLOR.draft}`}>
                      {STATUS_LABEL[t.status] || t.status}
                    </span>
                  </div>
                  {t.description && (
                    <p className="mb-2 text-xs text-grey line-clamp-1">{t.description}</p>
                  )}
                  <div className="mb-3 font-mono text-sm font-bold tracking-widest text-primary">{t.code}</div>
                  <div className="flex flex-wrap gap-2">
                    {(t.status === "draft") && (
                      <Link href={`/test/create?code=${t.code}`} className="rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">Түзөтүү</Link>
                    )}
                    {(t.status === "waiting" || t.status === "live") && (
                      <Link href={`/test/${t.code}/monitor`} className="rounded-lg bg-green-100 px-3 py-1.5 text-xs font-semibold text-green-700">Монитор</Link>
                    )}
                    {t.status === "finished" && (
                      <Link href={`/test/${t.code}/results`} className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">Жыйынтыктар</Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {myTests.length >= 6 && (
              <div className="mt-4 text-center">
                <Link href="/test/my" className="text-sm font-semibold text-primary hover:underline">Бардыгын көрүү →</Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
