"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Cookies from "js-cookie";
import { GO_API_URL } from "@/utils/apiData";

interface Session {
  ID: number;
  display_name: string;
  character_emoji: string;
  character_color: string;
  score: number;
  answered_count: number;
}
interface LiveTest { title: string; status: string; }
interface Answer { QuestionID: number; IsCorrect: boolean; Answer: string; PointsAwarded: number; }
interface Question { ID: number; text: string; type: string; correct: string; points: number; }
interface MyResult { session: Session; answers: Answer[]; questions: Question[]; }

const MEDALS = ["🥇", "🥈", "🥉"];

export default function ResultsPage() {
  const { code } = useParams<{ code: string }>();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [test, setTest] = useState<LiveTest | null>(null);
  const [myResult, setMyResult] = useState<MyResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"my" | "all">("my");

  useEffect(() => {
    let uid = 0;
    const token = Cookies.get("auth_token");
    if (token) {
      try { uid = JSON.parse(atob(token.split(".")[1])).user_id || 0; } catch {}
    }
    if (!uid) {
      const stored = sessionStorage.getItem("lt_anon_uid");
      uid = stored ? parseInt(stored, 10) : 0;
    }

    const fetchAll = fetch(`${GO_API_URL}/api/live-test/${code}/results`)
      .then((r) => r.json())
      .then((d) => { setTest(d.test); setSessions(d.sessions || []); });

    const fetchMy = uid
      ? fetch(`${GO_API_URL}/api/live-test/${code}/my-results?user_id=${uid}`)
          .then((r) => r.ok ? r.json() : null)
          .then((d) => d && setMyResult(d))
          .catch(() => {})
      : Promise.resolve();

    Promise.all([fetchAll, fetchMy]).finally(() => setLoading(false));
  }, [code]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-gray via-white to-deep-slate">
        <div className="text-center text-midnight_text"><div className="mb-2 text-4xl">⏳</div>Загрузка...</div>
      </div>
    );
  }

  const top3 = sessions.slice(0, 3);
  const myRank = myResult ? sessions.findIndex((s) => s.ID === myResult.session.ID) + 1 : 0;
  const correctCount = myResult ? myResult.answers.filter((a) => a.IsCorrect).length : 0;

  const parseCorrect = (s: string): string => {
    try { return JSON.parse(s).join(", "); } catch { return s; }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-gray via-white to-deep-slate px-3 py-8">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-secondary/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-lg">

        {/* Header */}
        <div className="mb-5 text-center">
          <div className="mb-2 text-4xl sm:text-5xl">🏆</div>
          <h1 className="text-2xl font-black text-midnight_text sm:text-3xl">{test?.title || "Результаты"}</h1>
          <p className="mt-1 text-sm text-grey">{sessions.length} участников</p>
        </div>

        {/* Tabs */}
        {myResult && (
          <div className="mb-4 flex rounded-xl bg-white p-1 shadow-sm border border-slate-100">
            <button
              onClick={() => setTab("my")}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all ${tab === "my" ? "bg-primary text-white" : "text-grey"}`}
            >
              Мои результаты
            </button>
            <button
              onClick={() => setTab("all")}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all ${tab === "all" ? "bg-primary text-white" : "text-grey"}`}
            >
              Рейтинг
            </button>
          </div>
        )}

        {/* My results */}
        {tab === "my" && myResult && (
          <div className="mb-6">
            <div
              className="mb-4 rounded-3xl bg-white p-5 text-center shadow-md border border-slate-100"
            >
              <div className="mb-1 text-4xl">{myResult.session.character_emoji}</div>
              <div className="text-lg font-extrabold text-midnight_text">{myResult.session.display_name}</div>
              <div className="mt-3 flex justify-center gap-6">
                <div className="text-center">
                  <div className="text-3xl font-extrabold text-primary">{myResult.session.score}</div>
                  <div className="text-xs text-grey">баллов</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-extrabold text-midnight_text">{correctCount}/{myResult.answers.length}</div>
                  <div className="text-xs text-grey">правильных ответов</div>
                </div>
                {myRank > 0 && (
                  <div className="text-center">
                    <div className="text-3xl font-extrabold text-midnight_text">{myRank < 4 ? MEDALS[myRank - 1] : `#${myRank}`}</div>
                    <div className="text-xs text-grey">место</div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {myResult.questions.map((q) => {
                const ans = myResult.answers.find((a) => a.QuestionID === q.ID);
                return (
                  <div
                    key={q.ID}
                    className={`rounded-xl bg-white px-4 py-3 shadow-sm border ${ans?.IsCorrect ? "border-green-200" : "border-red-200"}`}
                  >
                    <div className="flex items-start gap-2">
                      <span className="mt-0.5 text-lg">{ans?.IsCorrect ? "✅" : "❌"}</span>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-midnight_text">{q.text}</p>
                        {ans && (
                          <p className="mt-0.5 text-xs text-grey">
                            Ваш ответ: <span className="text-midnight_text">{ans.Answer || "—"}</span>
                          </p>
                        )}
                        {!ans?.IsCorrect && (
                          <p className="mt-0.5 text-xs text-green-600">Правильный ответ: {parseCorrect(q.correct)}</p>
                        )}
                        {ans?.IsCorrect && (
                          <p className="mt-0.5 text-xs text-green-600">+{ans.PointsAwarded} баллов</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Leaderboard */}
        {(tab === "all" || !myResult) && (
          <>
            {top3.length > 0 && (
              <div className="mb-5 flex items-end justify-center gap-1 sm:gap-2">
                {top3[1] && (
                  <div className="flex flex-col items-center">
                    <span className="mb-1 text-2xl sm:text-3xl">{top3[1].character_emoji}</span>
                    <span className="mb-1 w-16 truncate text-center text-xs font-bold text-midnight_text sm:w-20">{top3[1].display_name}</span>
                    <div className="flex w-16 flex-col items-center justify-end rounded-t-xl bg-white shadow-md border border-slate-100 sm:w-20" style={{ height: 70 }}>
                      <span className="text-xl">🥈</span>
                      <span className="text-xs font-bold text-midnight_text pb-1">{top3[1].score}</span>
                    </div>
                  </div>
                )}
                {top3[0] && (
                  <div className="flex flex-col items-center">
                    <span className="mb-1 animate-bounce text-3xl sm:text-4xl">{top3[0].character_emoji}</span>
                    <span className="mb-1 w-20 truncate text-center text-xs font-bold text-midnight_text sm:w-24">{top3[0].display_name}</span>
                    <div className="flex w-20 flex-col items-center justify-end rounded-t-xl bg-white shadow-md border border-primary/20 sm:w-24" style={{ height: 100 }}>
                      <span className="text-2xl">🥇</span>
                      <span className="text-sm font-extrabold text-primary pb-1">{top3[0].score}</span>
                    </div>
                  </div>
                )}
                {top3[2] && (
                  <div className="flex flex-col items-center">
                    <span className="mb-1 text-2xl sm:text-3xl">{top3[2].character_emoji}</span>
                    <span className="mb-1 w-16 truncate text-center text-xs font-bold text-midnight_text sm:w-20">{top3[2].display_name}</span>
                    <div className="flex w-16 flex-col items-center justify-end rounded-t-xl bg-white shadow-md border border-slate-100 sm:w-20" style={{ height: 50 }}>
                      <span className="text-xl">🥉</span>
                      <span className="text-xs font-bold text-midnight_text pb-1">{top3[2].score}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
            <div className="mb-6 flex flex-col gap-2">
              {sessions.map((s, i) => (
                <div
                  key={s.ID}
                  className={`flex items-center gap-2 rounded-xl bg-white px-3 py-2.5 shadow-sm border border-slate-100 ${myResult?.session.ID === s.ID ? "ring-2 ring-primary/40" : ""}`}
                >
                  <span className="w-5 shrink-0 text-center text-sm font-bold text-grey">
                    {i < 3 ? MEDALS[i] : `${i + 1}`}
                  </span>
                  <span className="text-xl">{s.character_emoji}</span>
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-midnight_text">{s.display_name}</span>
                  <div className="text-right">
                    <div className="font-extrabold text-primary">{s.score}</div>
                    <div className="text-xs text-grey">{s.answered_count} ответов</div>
                  </div>
                </div>
              ))}
              {sessions.length === 0 && (
                <div className="py-10 text-center text-sm text-grey">Нет участников</div>
              )}
            </div>
          </>
        )}

        <div className="text-center">
          <Link href="/test" className="inline-block rounded-full bg-primary px-6 py-3 font-semibold text-white shadow-lg hover:brightness-110 active:scale-95 transition-all">
            Главная
          </Link>
        </div>
      </div>
    </div>
  );
}
