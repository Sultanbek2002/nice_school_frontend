"use client";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { GAME_WS_URL } from "@/utils/apiData";

interface Session {
  ID: number;
  display_name: string;
  character_emoji: string;
  character_color: string;
  score: number;
  answered_count: number;
}
interface Question { id: number; text: string; type: string; options: string; points: number; time_limit: number; }
interface QMsg { question: Question; index: number; total: number; ends_at: number; }

export default function MonitorPage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const wsRef = useRef<WebSocket | null>(null);

  const [status, setStatus] = useState<"connecting" | "lobby" | "live" | "finished">("connecting");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [current, setCurrent] = useState<QMsg | null>(null);
  const [testTitle, setTestTitle] = useState("");
  const [timeLeft, setTimeLeft] = useState(0);
  const [myUserID, setMyUserID] = useState(0);
  const [showStandings, setShowStandings] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const token = Cookies.get("auth_token");
    if (!token) { router.push("/student"); return; }
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setMyUserID(payload.user_id || 0);
    } catch {}
  }, []);

  useEffect(() => {
    if (!myUserID) return;
    const ws = new WebSocket(`${GAME_WS_URL}/api/live-test/${code}/ws`);
    wsRef.current = ws;

    ws.onopen = () => ws.send(JSON.stringify({ type: "host_join", data: { user_id: myUserID } }));

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        switch (msg.type) {
          case "test_info":
            setTestTitle(msg.data.test?.title || "");
            setSessions(msg.data.sessions || []);
            setStatus(msg.data.status === "waiting" ? "lobby" : msg.data.status);
            break;
          case "lobby":
            setSessions(msg.data.sessions || []);
            setStatus("lobby");
            break;
          case "question":
            setCurrent(msg.data);
            setStatus("live");
            setShowStandings(false);
            startTimer(msg.data.ends_at, msg.data.question.time_limit);
            break;
          case "standings":
            setSessions(msg.data.sessions || []);
            break;
          case "finished":
            setSessions(msg.data.sessions || []);
            setStatus("finished");
            if (timerRef.current) clearInterval(timerRef.current);
            break;
          case "cancelled":
            router.push("/test");
            break;
        }
      } catch {}
    };

    ws.onerror = () => {};
    ws.onclose = () => {};
    return () => { ws.close(); if (timerRef.current) clearInterval(timerRef.current); };
  }, [myUserID]);

  const startTimer = (endsAt: number, limit: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    const tick = () => {
      const left = Math.max(0, endsAt - Date.now() / 1000);
      setTimeLeft(Math.round(left));
      if (left <= 0) clearInterval(timerRef.current!);
    };
    tick();
    timerRef.current = setInterval(tick, 1000);
  };

  const send = (type: string) => wsRef.current?.send(JSON.stringify({ type }));
  const parseOptions = (s: string): string[] => { try { return JSON.parse(s); } catch { return []; } };
  const isLast = current && current.index + 1 >= current.total;

  return (
    <div className="flex min-h-[100dvh] flex-col bg-gradient-to-br from-slate-900 to-indigo-950 text-white">

      {/* Header */}
      <div className="shrink-0 border-b border-white/10 px-4 py-3">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-2">
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-extrabold sm:text-xl">{testTitle || "Монитор"}</h1>
            <p className="text-xs text-white/50">
              Код: <span className="font-mono font-bold tracking-widest text-primary">{code}</span>
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            {status === "lobby" && (
              <button
                onClick={() => send("start")}
                disabled={sessions.length === 0}
                className="rounded-xl bg-green-500 px-4 py-2 text-sm font-bold text-white disabled:opacity-50 active:scale-95"
              >
                🚀 Баштоо ({sessions.length})
              </button>
            )}
            {status === "live" && (
              <>
                <button
                  onClick={() => send(isLast ? "finish" : "next")}
                  className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white active:scale-95"
                >
                  {isLast ? "🏁 Бүтүрүү" : "→ Кийинки"}
                </button>
                <button
                  onClick={() => send("finish")}
                  className="rounded-xl border border-white/20 px-3 py-2 text-xs text-white/60 active:scale-95"
                >
                  Токтотуу
                </button>
              </>
            )}
            {status === "finished" && (
              <button
                onClick={() => router.push(`/test/${code}/results`)}
                className="rounded-xl bg-white/20 px-4 py-2 text-sm font-bold text-white active:scale-95"
              >
                Жыйынтыктар →
              </button>
            )}
            {(status === "lobby" || status === "live") && (
              <button
                onClick={() => {
                  if (confirm("Тестти жокко чыгарасызбы? Бардык катышуучулар чыгарылат.")) {
                    send("cancel");
                  }
                }}
                className="rounded-xl border border-red-400/50 px-3 py-2 text-xs font-semibold text-red-400 active:scale-95"
              >
                Жокко чыгаруу
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile tab toggle */}
        <div className="flex border-b border-white/10 lg:hidden">
          <button
            onClick={() => setShowStandings(false)}
            className={`flex-1 py-2 text-sm font-semibold ${!showStandings ? "border-b-2 border-primary text-white" : "text-white/40"}`}
          >
            Суроо
          </button>
          <button
            onClick={() => setShowStandings(true)}
            className={`flex-1 py-2 text-sm font-semibold ${showStandings ? "border-b-2 border-primary text-white" : "text-white/40"}`}
          >
            Рейтинг ({sessions.length})
          </button>
        </div>

        <div className="mx-auto flex w-full max-w-4xl flex-1 gap-4 overflow-hidden p-4">

          {/* Question panel */}
          <div className={`flex flex-1 flex-col overflow-hidden ${showStandings ? "hidden lg:flex" : "flex"}`}>
            {status === "connecting" && (
              <div className="flex flex-1 flex-col items-center justify-center rounded-2xl bg-white/5 text-white/40">
                <div className="mb-2 text-4xl">📡</div>
                <p>Байланышуу...</p>
              </div>
            )}

            {status === "lobby" && (
              <div className="flex flex-1 flex-col items-center justify-center rounded-2xl bg-white/5 p-6 text-center">
                <div className="mb-3 text-4xl sm:text-5xl">🎮</div>
                <p className="text-lg font-bold">Лобби ачык</p>
                <p className="mt-1 text-sm text-white/50">Катышуучулар кошулуп жатат...</p>
                <div className="mt-4 rounded-xl bg-white/5 px-6 py-3">
                  <div className="font-mono text-3xl font-extrabold tracking-[0.25em] text-primary sm:text-4xl">{code}</div>
                  <p className="mt-1 text-xs text-white/30">nice.school/test</p>
                </div>
                {sessions.length > 0 && (
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    {sessions.map((s) => (
                      <div key={s.ID} className="flex items-center gap-1 rounded-lg bg-white/10 px-2 py-1 text-xs">
                        <span>{s.character_emoji}</span>
                        <span className="text-white/80">{s.display_name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {(status === "live" || status === "finished") && current && (
              <div className="flex flex-1 flex-col rounded-2xl bg-white/5 p-4">
                <div className="mb-2 flex items-center justify-between text-xs text-white/50">
                  <span>Суроо {current.index + 1} / {current.total}</span>
                  <span className={`font-bold text-sm ${timeLeft <= 5 ? "text-red-400 animate-pulse" : "text-white"}`}>
                    {status === "live" ? `${timeLeft}с` : "Бүттү"}
                  </span>
                </div>
                <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${timeLeft <= 5 ? "bg-red-400" : "bg-primary"}`}
                    style={{ width: `${(timeLeft / (current.question.time_limit || 30)) * 100}%` }}
                  />
                </div>
                <p className="mb-4 text-base font-bold leading-snug text-white sm:text-xl">
                  {current.question.text}
                </p>
                {parseOptions(current.question.options).length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    {parseOptions(current.question.options).map((opt, i) => {
                      const colors = ["#FF6B6B", "#4ECDC4", "#FFE66D", "#6C5CE7"];
                      return (
                        <div
                          key={i}
                          className="rounded-xl px-3 py-2 text-sm font-semibold"
                          style={{ background: colors[i % 4] + "33", borderLeft: `3px solid ${colors[i % 4]}` }}
                        >
                          {opt}
                        </div>
                      );
                    })}
                  </div>
                )}
                {current.question.type === "text" && (
                  <div className="rounded-xl bg-white/5 px-3 py-2 text-sm italic text-white/60">
                    Текст жооп
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Standings panel */}
          <div className={`w-full overflow-y-auto lg:w-64 ${showStandings ? "block" : "hidden lg:block"}`}>
            <h2 className="mb-2 hidden text-xs font-semibold uppercase tracking-wider text-white/50 lg:block">
              Рейтинг ({sessions.length})
            </h2>
            <div className="flex flex-col gap-1.5">
              {sessions.map((s, i) => (
                <div
                  key={s.ID}
                  className="flex items-center gap-2 rounded-xl px-3 py-2"
                  style={{ background: s.character_color + "22" }}
                >
                  <span className="w-4 shrink-0 text-xs font-bold text-white/40">{i + 1}</span>
                  <span className="text-lg">{s.character_emoji}</span>
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-white">{s.display_name}</span>
                  <span className="shrink-0 font-extrabold text-white">{s.score}</span>
                </div>
              ))}
              {sessions.length === 0 && (
                <div className="py-8 text-center text-sm text-white/30">Катышуучулар жок</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
