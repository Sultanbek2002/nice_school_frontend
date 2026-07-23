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
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-primary">
        <div className="text-center text-white"><div className="mb-2 text-4xl">⏳</div>Жүктөлүүдө...</div>
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-primary px-3 py-8">
      <div className="mx-auto max-w-lg">

        {/* Header */}
        <div className="mb-5 text-center">
          <div className="mb-2 text-4xl sm:text-5xl">🏆</div>
          <h1 className="text-2xl font-extrabold text-white sm:text-3xl">{test?.title || "Жыйынтыктар"}</h1>
          <p className="mt-1 text-sm text-white/50">{sessions.length} катышуучу</p>
        </div>

        {/* Tabs */}
        {myResult && (
          <div className="mb-4 flex rounded-xl bg-white/10 p-1">
            <button
              onClick={() => setTab("my")}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all ${tab === "my" ? "bg-white text-primary" : "text-white/60"}`}
            >
              Менин жыйынтыктарым
            </button>
            <button
              onClick={() => setTab("all")}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all ${tab === "all" ? "bg-white text-primary" : "text-white/60"}`}
            >
              Рейтинг
            </button>
          </div>
        )}

        {/* My results */}
        {tab === "my" && myResult && (
          <div className="mb-6">
            <div
              className="mb-4 rounded-2xl p-5 text-center"
              style={{ background: myResult.session.character_color + "33", border: `2px solid ${myResult.session.character_color}55` }}
            >
              <div className="mb-1 text-4xl">{myResult.session.character_emoji}</div>
              <div className="text-lg font-extrabold text-white">{myResult.session.display_name}</div>
              <div className="mt-3 flex justify-center gap-6">
                <div className="text-center">
                  <div className="text-3xl font-extrabold text-white">{myResult.session.score}</div>
                  <div className="text-xs text-white/50">упай</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-extrabold text-white">{correctCount}/{myResult.answers.length}</div>
                  <div className="text-xs text-white/50">туура жооп</div>
                </div>
                {myRank > 0 && (
                  <div className="text-center">
                    <div className="text-3xl font-extrabold text-white">{myRank < 4 ? MEDALS[myRank - 1] : `#${myRank}`}</div>
                    <div className="text-xs text-white/50">орун</div>
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
                    className={`rounded-xl px-4 py-3 ${ans?.IsCorrect ? "border border-green-500/30 bg-green-500/20" : "border border-red-500/30 bg-red-500/20"}`}
                  >
                    <div className="flex items-start gap-2">
                      <span className="mt-0.5 text-lg">{ans?.IsCorrect ? "✅" : "❌"}</span>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-white">{q.text}</p>
                        {ans && (
                          <p className="mt-0.5 text-xs text-white/60">
                            Жообуңуз: <span className="text-white/80">{ans.Answer || "—"}</span>
                          </p>
                        )}
                        {!ans?.IsCorrect && (
                          <p className="mt-0.5 text-xs text-green-400">Туура жооп: {parseCorrect(q.correct)}</p>
                        )}
                        {ans?.IsCorrect && (
                          <p className="mt-0.5 text-xs text-green-400">+{ans.PointsAwarded} упай</p>
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
                    <span className="mb-1 w-16 truncate text-center text-xs font-bold text-white sm:w-20">{top3[1].display_name}</span>
                    <div className="flex w-16 flex-col items-center justify-end rounded-t-xl sm:w-20" style={{ background: top3[1].character_color + "55", height: 70 }}>
                      <span className="text-xl">🥈</span>
                      <span className="text-xs font-bold text-white">{top3[1].score}</span>
                    </div>
                  </div>
                )}
                {top3[0] && (
                  <div className="flex flex-col items-center">
                    <span className="mb-1 animate-bounce text-3xl sm:text-4xl">{top3[0].character_emoji}</span>
                    <span className="mb-1 w-20 truncate text-center text-xs font-bold text-white sm:w-24">{top3[0].display_name}</span>
                    <div className="flex w-20 flex-col items-center justify-end rounded-t-xl sm:w-24" style={{ background: top3[0].character_color + "77", height: 100 }}>
                      <span className="text-2xl">🥇</span>
                      <span className="text-sm font-extrabold text-white">{top3[0].score}</span>
                    </div>
                  </div>
                )}
                {top3[2] && (
                  <div className="flex flex-col items-center">
                    <span className="mb-1 text-2xl sm:text-3xl">{top3[2].character_emoji}</span>
                    <span className="mb-1 w-16 truncate text-center text-xs font-bold text-white sm:w-20">{top3[2].display_name}</span>
                    <div className="flex w-16 flex-col items-center justify-end rounded-t-xl sm:w-20" style={{ background: top3[2].character_color + "44", height: 50 }}>
                      <span className="text-xl">🥉</span>
                      <span className="text-xs font-bold text-white">{top3[2].score}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
            <div className="mb-6 flex flex-col gap-2">
              {sessions.map((s, i) => (
                <div
                  key={s.ID}
                  className={`flex items-center gap-2 rounded-xl px-3 py-2.5 ${myResult?.session.ID === s.ID ? "ring-2 ring-white/40" : ""}`}
                  style={{ background: s.character_color + "22", border: `1.5px solid ${s.character_color}44` }}
                >
                  <span className="w-5 shrink-0 text-center text-sm font-bold text-white/60">
                    {i < 3 ? MEDALS[i] : `${i + 1}`}
                  </span>
                  <span className="text-xl">{s.character_emoji}</span>
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-white">{s.display_name}</span>
                  <div className="text-right">
                    <div className="font-extrabold text-white">{s.score}</div>
                    <div className="text-xs text-white/40">{s.answered_count} жооп</div>
                  </div>
                </div>
              ))}
              {sessions.length === 0 && (
                <div className="py-10 text-center text-sm text-white/40">Катышуучулар жок</div>
              )}
            </div>
          </>
        )}

        <div className="text-center">
          <Link href="/test" className="inline-block rounded-xl bg-white/20 px-6 py-3 font-semibold text-white backdrop-blur-sm active:scale-95">
            Башкы бет
          </Link>
        </div>
      </div>
    </div>
  );
}
