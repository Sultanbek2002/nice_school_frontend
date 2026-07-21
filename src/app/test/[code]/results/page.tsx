"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
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

const MEDALS = ["🥇", "🥈", "🥉"];

export default function ResultsPage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [test, setTest] = useState<LiveTest | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${GO_API_URL}/api/live-test/${code}/results`)
      .then((r) => r.json())
      .then((d) => { setTest(d.test); setSessions(d.sessions || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [code]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-primary">
        <div className="text-center text-white"><div className="mb-2 text-4xl">⏳</div>Жүктөлүүдө...</div>
      </div>
    );
  }

  const top3 = sessions.slice(0, 3);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-primary px-3 py-8">
      <div className="mx-auto max-w-lg">

        {/* Header */}
        <div className="mb-6 text-center">
          <div className="mb-2 text-4xl sm:text-5xl">🏆</div>
          <h1 className="text-2xl font-extrabold text-white sm:text-3xl">{test?.title || "Жыйынтыктар"}</h1>
          <p className="mt-1 text-sm text-white/50">{sessions.length} катышуучу</p>
        </div>

        {/* Podium */}
        {top3.length > 0 && (
          <div className="mb-6 flex items-end justify-center gap-1 sm:gap-2">
            {/* 2nd */}
            {top3[1] && (
              <div className="flex flex-col items-center">
                <span className="mb-1 text-2xl sm:text-3xl">{top3[1].character_emoji}</span>
                <span className="mb-1 w-16 truncate text-center text-xs font-bold text-white sm:w-20 sm:text-sm">{top3[1].display_name}</span>
                <div className="flex w-16 flex-col items-center justify-end rounded-t-xl sm:w-20" style={{ background: top3[1].character_color + "55", height: 70 }}>
                  <span className="text-xl">🥈</span>
                  <span className="text-xs font-bold text-white">{top3[1].score}</span>
                </div>
              </div>
            )}
            {/* 1st */}
            {top3[0] && (
              <div className="flex flex-col items-center">
                <span className="mb-1 animate-bounce text-3xl sm:text-4xl">{top3[0].character_emoji}</span>
                <span className="mb-1 w-20 truncate text-center text-xs font-bold text-white sm:w-24 sm:text-sm">{top3[0].display_name}</span>
                <div className="flex w-20 flex-col items-center justify-end rounded-t-xl sm:w-24" style={{ background: top3[0].character_color + "77", height: 100 }}>
                  <span className="text-2xl">🥇</span>
                  <span className="text-sm font-extrabold text-white">{top3[0].score}</span>
                </div>
              </div>
            )}
            {/* 3rd */}
            {top3[2] && (
              <div className="flex flex-col items-center">
                <span className="mb-1 text-2xl sm:text-3xl">{top3[2].character_emoji}</span>
                <span className="mb-1 w-16 truncate text-center text-xs font-bold text-white sm:w-20 sm:text-sm">{top3[2].display_name}</span>
                <div className="flex w-16 flex-col items-center justify-end rounded-t-xl sm:w-20" style={{ background: top3[2].character_color + "44", height: 50 }}>
                  <span className="text-xl">🥉</span>
                  <span className="text-xs font-bold text-white">{top3[2].score}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Full leaderboard */}
        <div className="mb-6 flex flex-col gap-2">
          {sessions.map((s, i) => (
            <div
              key={s.ID}
              className="flex items-center gap-2 rounded-xl px-3 py-2.5"
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

        <div className="text-center">
          <Link href="/test" className="inline-block rounded-xl bg-white/20 px-6 py-3 font-semibold text-white backdrop-blur-sm active:scale-95">
            Башкы бет
          </Link>
        </div>
      </div>
    </div>
  );
}
