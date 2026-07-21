"use client";
import { useEffect, useState } from "react";
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
  CreatedAt: string;
}

const STATUS_LABEL: Record<string, string> = {
  draft: "Черновик",
  waiting: "Ожидает",
  live: "Идёт",
  finished: "Завершён",
};

const STATUS_COLOR: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  waiting: "bg-yellow-100 text-yellow-700",
  live: "bg-green-100 text-green-700",
  finished: "bg-slate-100 text-slate-500",
};

export default function MyTestsPage() {
  const router = useRouter();
  const [tests, setTests] = useState<LiveTest[]>([]);
  const [loading, setLoading] = useState(true);
  const token = Cookies.get("auth_token");

  useEffect(() => {
    if (!token) { router.push("/student"); return; }
    fetch(`${GO_API_URL}/api/live-tests/my`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => setTests(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const deleteTest = async (code: string) => {
    if (!confirm("Чын эле жок кылайынбы?")) return;
    await fetch(`${GO_API_URL}/api/live-test/${code}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    setTests((prev) => prev.filter((t) => t.code !== code));
  };

  return (
    <div className="min-h-screen bg-slate-gray px-3 py-6 sm:px-4 sm:py-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-5 flex items-center gap-3">
          <button onClick={() => router.push("/test")} className="shrink-0 text-grey hover:text-midnight_text">
            ← Артка
          </button>
          <h1 className="min-w-0 flex-1 truncate text-xl font-extrabold text-midnight_text sm:text-2xl">Менин тесттерим</h1>
          <Link
            href="/test/create"
            className="ml-auto shrink-0 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-white active:scale-95 sm:px-4"
          >
            + Жаңы
          </Link>
        </div>

        {loading && (
          <div className="py-20 text-center text-grey">Жүктөлүүдө...</div>
        )}

        {!loading && tests.length === 0 && (
          <div className="glass-card rounded-2xl py-16 text-center">
            <div className="mb-3 text-5xl">📝</div>
            <p className="text-grey mb-4">Тест жок. Биринчи тесттиңизди түзүңүз!</p>
            <Link
              href="/test/create"
              className="rounded-xl bg-primary px-6 py-3 font-semibold text-white hover:bg-primary/90"
            >
              Тест түзүү
            </Link>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {tests.map((t) => (
            <div key={t.ID} className="glass-card rounded-2xl p-4 sm:p-5">
              <div className="mb-3 flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span className="font-bold text-midnight_text">{t.title}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COLOR[t.status] || STATUS_COLOR.draft}`}>
                      {STATUS_LABEL[t.status] || t.status}
                    </span>
                  </div>
                  {t.description && (
                    <p className="mb-1 text-sm text-grey line-clamp-1">{t.description}</p>
                  )}
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-bold tracking-widest text-primary">{t.code}</span>
                    <span className="text-xs text-grey/60">{new Date(t.CreatedAt).toLocaleDateString("ru-RU")}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {t.status === "draft" && (
                  <Link
                    href={`/test/create?code=${t.code}`}
                    className="rounded-lg bg-primary/10 px-3 py-2 text-xs font-semibold text-primary active:scale-95"
                  >
                    Түзөтүү
                  </Link>
                )}
                {(t.status === "waiting" || t.status === "live") && (
                  <Link
                    href={`/test/${t.code}/monitor`}
                    className="rounded-lg bg-green-100 px-3 py-2 text-xs font-semibold text-green-700 active:scale-95"
                  >
                    Монитор
                  </Link>
                )}
                {t.status === "finished" && (
                  <Link
                    href={`/test/${t.code}/results`}
                    className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600 active:scale-95"
                  >
                    Жыйынтыктар
                  </Link>
                )}
                <button
                  onClick={() => deleteTest(t.code)}
                  className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-500 active:scale-95"
                >
                  Жок кыл
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
