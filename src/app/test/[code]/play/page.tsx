"use client";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { GAME_WS_URL } from "@/utils/apiData";

interface Question {
  id: number;
  text: string;
  type: string;
  options: string;
  points: number;
  time_limit: number;
}

interface QMessage {
  question: Question;
  index: number;
  total: number;
  ends_at: number;
}

interface AnswerAck {
  is_correct: boolean;
  points_awarded: number;
  correct_answer: string;
}

const OPTION_COLORS = ["#FF6B6B", "#4ECDC4", "#FFE66D", "#6C5CE7"];
const OPTION_LABELS = ["A", "B", "C", "D"];

export default function PlayPage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const wsRef = useRef<WebSocket | null>(null);

  const [current, setCurrent] = useState<QMessage | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [selectedMulti, setSelectedMulti] = useState<string[]>([]);
  const [textAnswer, setTextAnswer] = useState("");
  const [ack, setAck] = useState<AnswerAck | null>(null);
  const [score, setScore] = useState(0);
  const [myUserID, setMyUserID] = useState(0);
  const [displayName, setDisplayName] = useState("");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const token = Cookies.get("auth_token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setMyUserID(payload.user_id || 0);
        setDisplayName(payload.full_name || payload.email?.split("@")[0] || "");
        return;
      } catch {}
    }
    const stored = sessionStorage.getItem("lt_anon_uid");
    setMyUserID(stored ? parseInt(stored, 10) : 0);
  }, []);

  useEffect(() => {
    if (!myUserID) return;

    const existingWs = (window as any).__ltWs as WebSocket | undefined;
    let ws: WebSocket;

    if (existingWs && existingWs.readyState === WebSocket.OPEN) {
      ws = existingWs;
    } else {
      ws = new WebSocket(`${GAME_WS_URL}/api/live-test/${code}/ws`);
      ws.onopen = () => {
        ws.send(JSON.stringify({
          type: "join",
          data: { display_name: displayName, character_emoji: "🦊", character_color: "#FF6B6B", user_id: myUserID },
        }));
      };
    }
    wsRef.current = ws;
    (window as any).__ltWs = ws;

    const cached = sessionStorage.getItem(`lt_q_${code}`);
    if (cached) {
      try { applyQuestion(JSON.parse(cached) as QMessage); sessionStorage.removeItem(`lt_q_${code}`); } catch {}
    }

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === "question") applyQuestion(msg.data as QMessage);
        else if (msg.type === "answer_ack") {
          const a = msg.data as AnswerAck;
          setAck(a);
          setScore((prev) => prev + a.points_awarded);
        } else if (msg.type === "finished") {
          router.push(`/test/${code}/results`);
        } else if (msg.type === "cancelled") {
          router.push("/test");
        }
      } catch {}
    };

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [myUserID]);

  const applyQuestion = (q: QMessage) => {
    setCurrent(q);
    setAnswered(false);
    setSelected(null);
    setSelectedMulti([]);
    setTextAnswer("");
    setAck(null);
    if (timerRef.current) clearInterval(timerRef.current);
    const tick = () => {
      const left = Math.max(0, q.ends_at - Date.now() / 1000);
      setTimeLeft(Math.round(left));
      if (left <= 0) clearInterval(timerRef.current!);
    };
    tick();
    timerRef.current = setInterval(tick, 1000);
  };

  const parseOptions = (s: string): string[] => {
    try { return JSON.parse(s); } catch { return []; }
  };

  const submitAnswer = (answer: string) => {
    if (answered || !wsRef.current || !current) return;
    setAnswered(true);
    wsRef.current.send(JSON.stringify({ type: "answer", data: { question_id: current.question.id, answer } }));
  };

  const toggleMulti = (opt: string) =>
    setSelectedMulti((p) => p.includes(opt) ? p.filter((x) => x !== opt) : [...p, opt]);

  if (!current) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-primary">
        <div className="text-center text-white">
          <div className="mb-3 text-5xl">⏳</div>
          <p className="text-base font-semibold">Суроо күтүлүүдө...</p>
        </div>
      </div>
    );
  }

  const opts = parseOptions(current.question.options);
  const timerPercent = (timeLeft / current.question.time_limit) * 100;

  return (
    <div className="flex min-h-[100dvh] flex-col bg-gradient-to-br from-indigo-900 via-purple-900 to-primary">

      {/* Top bar */}
      <div className="shrink-0 px-3 pt-3 pb-2">
        <div className="mb-1 flex items-center justify-between text-xs text-white/60">
          <span>{current.index + 1} / {current.total}</span>
          <span className={`font-bold text-sm ${timeLeft <= 5 ? "text-red-300 animate-pulse" : "text-white"}`}>
            {timeLeft}с
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-white/20">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${timeLeft <= 5 ? "bg-red-400" : "bg-white"}`}
            style={{ width: `${timerPercent}%` }}
          />
        </div>
        <div className="mt-1 flex justify-between text-xs text-white/50">
          <span>{current.question.points} упай</span>
          <span className="font-bold text-white/80">Жыйынтык: {score}</span>
        </div>
      </div>

      {/* Question */}
      <div className="px-3 pb-2">
        <div className="rounded-2xl bg-white/10 p-4 text-center backdrop-blur-sm">
          <p className="text-base font-bold leading-snug text-white sm:text-lg">
            {current.question.text}
          </p>
        </div>
      </div>

      {/* Answer ack */}
      {ack && (
        <div className={`mx-3 mb-2 rounded-2xl p-3 text-center font-bold ${ack.is_correct ? "bg-green-500/80" : "bg-red-500/80"} text-white`}>
          {ack.is_correct ? `✅ Туура! +${ack.points_awarded} упай` : "❌ Туура эмес"}
        </div>
      )}

      {/* Options — grows to fill remaining space */}
      <div className="flex flex-1 flex-col px-3 pb-4">
        {current.question.type === "single" && (
          <div className="grid flex-1 grid-cols-2 gap-2 sm:gap-3">
            {opts.map((opt, i) => (
              <button
                key={i}
                disabled={answered}
                onClick={() => { setSelected(opt); submitAnswer(opt); }}
                className="flex min-h-[70px] items-center rounded-2xl border-2 p-3 text-left font-semibold text-white transition-all active:scale-95 sm:min-h-[80px]"
                style={{
                  background: OPTION_COLORS[i % 4] + (selected === opt ? "cc" : "44"),
                  borderColor: OPTION_COLORS[i % 4] + (selected === opt ? "ff" : "66"),
                }}
              >
                <span className="mr-2 font-mono font-black text-xs opacity-70">{OPTION_LABELS[i]})</span>
                <span className="text-sm leading-tight">{opt}</span>
              </button>
            ))}
          </div>
        )}

        {current.question.type === "multiple" && (
          <div className="flex flex-1 flex-col">
            <div className="grid flex-1 grid-cols-2 gap-2 mb-3">
              {opts.map((opt, i) => (
                <button
                  key={i}
                  disabled={answered}
                  onClick={() => toggleMulti(opt)}
                  className="flex min-h-[70px] items-center rounded-2xl border-2 p-3 text-left font-semibold text-white transition-all active:scale-95"
                  style={{
                    background: OPTION_COLORS[i % 4] + (selectedMulti.includes(opt) ? "cc" : "44"),
                    borderColor: OPTION_COLORS[i % 4] + (selectedMulti.includes(opt) ? "ff" : "66"),
                  }}
                >
                  <span className="mr-2 text-sm">{selectedMulti.includes(opt) ? "✓" : OPTION_LABELS[i] + ")"}</span>
                  <span className="text-sm leading-tight">{opt}</span>
                </button>
              ))}
            </div>
            <button
              disabled={answered || selectedMulti.length === 0}
              onClick={() => submitAnswer(JSON.stringify(selectedMulti))}
              className="w-full rounded-2xl bg-white py-4 font-bold text-primary disabled:opacity-50 active:scale-95"
            >
              Тастыктоо
            </button>
          </div>
        )}

        {current.question.type === "true_false" && (
          <div className="grid flex-1 grid-cols-2 gap-3">
            {["Туура", "Жалган"].map((v, i) => (
              <button
                key={v}
                disabled={answered}
                onClick={() => { setSelected(v); submitAnswer(v); }}
                className="flex min-h-[100px] flex-col items-center justify-center rounded-2xl border-2 font-extrabold text-white transition-all active:scale-95 sm:min-h-[120px]"
                style={{
                  background: OPTION_COLORS[i] + (selected === v ? "cc" : "44"),
                  borderColor: OPTION_COLORS[i] + (selected === v ? "ff" : "66"),
                }}
              >
                <span className="mb-1 text-3xl">{v === "Туура" ? "✅" : "❌"}</span>
                <span className="text-base">{v}</span>
              </button>
            ))}
          </div>
        )}

        {current.question.type === "text" && (
          <div className="flex flex-1 flex-col justify-center gap-3">
            <input
              value={textAnswer}
              onChange={(e) => setTextAnswer(e.target.value)}
              disabled={answered}
              placeholder="Жооптуңузду жазыңыз..."
              className="w-full rounded-2xl bg-white/10 px-4 py-4 text-center text-base text-white placeholder:text-white/40 border border-white/20 focus:border-white focus:outline-none"
            />
            <button
              disabled={answered || !textAnswer.trim()}
              onClick={() => submitAnswer(textAnswer)}
              className="w-full rounded-2xl bg-white py-4 font-bold text-primary disabled:opacity-50 active:scale-95"
            >
              Жооп берүү
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
