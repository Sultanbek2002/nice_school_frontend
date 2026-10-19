"use client";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { GAME_WS_URL, GO_API_URL } from "@/utils/apiData";

interface Question { id: number; text: string; type: string; options: string; points: number; time_limit: number; }
interface QMessage { question: Question; index: number; total: number; ends_at: number; }
interface AnswerAck { is_correct: boolean; points_awarded: number; correct_answer: string; needs_review?: boolean; }

const OPTION_COLORS = ["#FF6B6B", "#4ECDC4", "#FFE66D", "#6C5CE7", "#54A0FF", "#5CE65C"];
const OPTION_LABELS = ["A", "B", "C", "D", "E", "F"];
const TAB_WARNING_MS = 4000;

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
  const [essayAnswer, setEssayAnswer] = useState("");
  const [orderPicked, setOrderPicked] = useState<string[]>([]);
  const [matchPairs, setMatchPairs] = useState<Record<number, string>>({});
  const [matchActiveLeft, setMatchActiveLeft] = useState<number | null>(null);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaUploading, setMediaUploading] = useState(false);
  const [mediaError, setMediaError] = useState("");
  const [ack, setAck] = useState<AnswerAck | null>(null);
  const [questionEnded, setQuestionEnded] = useState<string | null>(null); // correct_answer JSON
  const [score, setScore] = useState(0);
  const [myUserID, setMyUserID] = useState(0);
  const [displayName, setDisplayName] = useState("");
  const [tabSwitches, setTabSwitches] = useState(0);
  const [showTabWarning, setShowTabWarning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tabWarningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
        if (msg.type === "question") {
          setQuestionEnded(null);
          applyQuestion(msg.data as QMessage);
        } else if (msg.type === "question_ended") {
          setQuestionEnded(msg.data.correct_answer);
          if (!answered) setAnswered(true);
        } else if (msg.type === "answer_ack") {
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

  // Anti-cheat: flag (not auto-fail) when the student leaves the test tab/app.
  // Browsers don't let JS block tab switching, so detection + reporting to the
  // teacher is the only feasible enforcement — a hard auto-submit risks
  // punishing accidental swipes/notifications as hard as real cheating.
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState !== "hidden" || !current) return;
      setTabSwitches((prev) => {
        const next = prev + 1;
        wsRef.current?.send(JSON.stringify({ type: "tab_switch", data: { count: 1 } }));
        return next;
      });
      setShowTabWarning(true);
      if (tabWarningTimerRef.current) clearTimeout(tabWarningTimerRef.current);
      tabWarningTimerRef.current = setTimeout(() => setShowTabWarning(false), TAB_WARNING_MS);
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      if (tabWarningTimerRef.current) clearTimeout(tabWarningTimerRef.current);
    };
  }, [current]);

  const applyQuestion = (q: QMessage) => {
    setCurrent(q);
    setAnswered(false);
    setSelected(null);
    setSelectedMulti([]);
    setTextAnswer("");
    setEssayAnswer("");
    setOrderPicked([]);
    setMatchPairs({});
    setMatchActiveLeft(null);
    setMediaUrl(null);
    setMediaError("");
    setAck(null);
    setQuestionEnded(null);
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
  const parseMatchOptions = (s: string): { left: string[]; right: string[] } => {
    try { const o = JSON.parse(s); return { left: o.left || [], right: o.right || [] }; } catch { return { left: [], right: [] }; }
  };
  const parseCorrect = (s: string): string[] => {
    try { return JSON.parse(s); } catch { return [s]; }
  };

  const submitAnswer = (answer: string) => {
    if (answered || !wsRef.current || !current) return;
    setAnswered(true);
    wsRef.current.send(JSON.stringify({ type: "answer", data: { question_id: current.question.id, answer } }));
  };

  const toggleMulti = (opt: string) =>
    setSelectedMulti((p) => p.includes(opt) ? p.filter((x) => x !== opt) : [...p, opt]);

  const pickOrderItem = (item: string) => {
    if (answered || orderPicked.includes(item)) return;
    setOrderPicked((p) => [...p, item]);
  };
  const resetOrder = () => { if (!answered) setOrderPicked([]); };

  const pickMatch = (leftIdx: number, rightVal: string) => {
    if (answered) return;
    setMatchPairs((prev) => {
      const next = { ...prev };
      // free up this right value if it was assigned to a different left item
      for (const k of Object.keys(next)) {
        if (next[+k] === rightVal) delete next[+k];
      }
      next[leftIdx] = rightVal;
      return next;
    });
    setMatchActiveLeft(null);
  };

  const uploadMedia = async (file: File) => {
    setMediaUploading(true);
    setMediaError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`${GO_API_URL}/api/live-test/${code}/upload-answer-media`, { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка загрузки");
      setMediaUrl(data.url);
    } catch (e: any) {
      setMediaError(e.message || "Ошибка загрузки");
    } finally {
      setMediaUploading(false);
    }
  };

  if (!current) {
    return (
      <div className="flex h-[100dvh] items-center justify-center overflow-hidden bg-gradient-to-br from-slate-gray via-white to-deep-slate">
        <div className="text-center text-midnight_text">
          <div className="mb-3 text-5xl">⏳</div>
          <p className="text-base font-semibold">Ожидание вопроса...</p>
        </div>
      </div>
    );
  }

  const qtype = current.question.type;
  const opts = parseOptions(current.question.options);
  const matchOpts = qtype === "matching" ? parseMatchOptions(current.question.options) : { left: [], right: [] };
  const orderOpts = qtype === "ordering" ? opts : [];
  const timerPercent = (timeLeft / current.question.time_limit) * 100;
  const correctList = ack ? parseCorrect(ack.correct_answer) : questionEnded ? parseCorrect(questionEnded) : [];
  const showResult = ack !== null || questionEnded !== null;
  const needsReview = qtype === "essay" || qtype === "media";

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-gradient-to-br from-slate-gray via-white to-deep-slate">

      {/* Tab-switch warning */}
      {showTabWarning && (
        <div className="absolute inset-x-0 top-0 z-50 bg-red-600 px-3 py-2 text-center text-xs font-bold text-white shadow-lg sm:text-sm">
          ⚠️ Вы покинули вкладку теста! Это фиксируется ({tabSwitches})
        </div>
      )}

      {/* Top bar */}
      <div className="shrink-0 px-3 pt-3 pb-2">
        <div className="mb-1 flex items-center justify-between text-xs text-grey">
          <span>{current.index + 1} / {current.total}</span>
          <span className={`font-bold text-sm ${timeLeft <= 5 ? "text-red-500 animate-pulse" : "text-midnight_text"}`}>
            {timeLeft}с
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${timeLeft <= 5 ? "bg-red-500" : "bg-primary"}`}
            style={{ width: `${timerPercent}%` }}
          />
        </div>
        <div className="mt-1 flex justify-between text-xs text-grey">
          <span>{current.question.points} баллов</span>
          <span className="font-bold text-midnight_text">Счёт: {score}</span>
        </div>
      </div>

      {/* Question */}
      <div className="shrink-0 px-3 pb-2">
        <div className="max-h-[22dvh] overflow-y-auto rounded-2xl bg-white p-4 text-center shadow-md border border-slate-100">
          <p className="text-base font-bold leading-snug text-midnight_text sm:text-lg">
            {current.question.text}
          </p>
        </div>
      </div>

      {/* Answer result overlay */}
      {showResult && (
        <div className={`mx-3 mb-2 shrink-0 rounded-2xl p-3 text-center text-white ${
          needsReview ? "bg-orange-500/90" : ack ? (ack.is_correct ? "bg-primary/90" : "bg-red-500/90") : "bg-orange-500/90"
        }`}>
          {needsReview && ack ? (
            <div className="text-base font-bold">⏳ Ответ отправлен — проверит преподаватель</div>
          ) : ack ? (
            <>
              <div className="text-base font-bold">{ack.is_correct ? `✅ Верно! +${ack.points_awarded} баллов` : ack.points_awarded > 0 ? `☑️ Частично верно! +${ack.points_awarded} баллов` : "❌ Неверно"}</div>
              {!ack.is_correct && correctList.length > 0 && (
                <div className="mt-1 text-sm opacity-90">Правильный ответ: <span className="font-bold">{correctList.join(", ")}</span></div>
              )}
            </>
          ) : (
            <>
              <div className="text-base font-bold">⏰ Время вышло</div>
              {!needsReview && correctList.length > 0 && (
                <div className="mt-1 text-sm opacity-90">Правильный ответ: <span className="font-bold">{correctList.join(", ")}</span></div>
              )}
            </>
          )}
        </div>
      )}

      {/* Options — scrollable safety net, but sized to fit without needing it in the normal case */}
      <div className="flex min-h-0 flex-1 flex-col px-3 pb-3">
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">

          {qtype === "single" && (
            <div className="grid flex-1 auto-rows-fr grid-cols-2 gap-2 sm:gap-3">
              {opts.map((opt, i) => {
                const isCorrectOpt = showResult && correctList.includes(opt);
                const isSelected = selected === opt;
                return (
                  <button
                    key={i}
                    disabled={answered}
                    onClick={() => { setSelected(opt); submitAnswer(opt); }}
                    className="flex min-h-[64px] items-center rounded-2xl border-2 p-3 text-left font-semibold text-white transition-all active:scale-95"
                    style={{
                      background: isCorrectOpt ? "#22c55e" : OPTION_COLORS[i % 6] + (isSelected ? "ee" : "cc"),
                      borderColor: isCorrectOpt ? "#16a34a" : OPTION_COLORS[i % 6],
                    }}
                  >
                    <span className="mr-2 font-mono font-black text-xs opacity-70">{OPTION_LABELS[i]})</span>
                    <span className="text-sm leading-tight">{opt}</span>
                    {isCorrectOpt && <span className="ml-auto">✅</span>}
                  </button>
                );
              })}
            </div>
          )}

          {qtype === "multiple" && (
            <div className="flex flex-1 flex-col">
              <div className="grid flex-1 auto-rows-fr grid-cols-2 gap-2 mb-3">
                {opts.map((opt, i) => {
                  const isCorrectOpt = showResult && correctList.includes(opt);
                  const isSelected = selectedMulti.includes(opt);
                  return (
                    <button
                      key={i}
                      disabled={answered}
                      onClick={() => toggleMulti(opt)}
                      className="flex min-h-[64px] items-center rounded-2xl border-2 p-3 text-left font-semibold text-white transition-all active:scale-95"
                      style={{
                        background: isCorrectOpt ? "#22c55e" : OPTION_COLORS[i % 6] + (isSelected ? "ee" : "cc"),
                        borderColor: isCorrectOpt ? "#16a34a" : OPTION_COLORS[i % 6],
                      }}
                    >
                      <span className="mr-2 text-sm">{isSelected ? "✓" : OPTION_LABELS[i] + ")"}</span>
                      <span className="text-sm leading-tight">{opt}</span>
                      {isCorrectOpt && <span className="ml-auto">✅</span>}
                    </button>
                  );
                })}
              </div>
              <button
                disabled={answered || selectedMulti.length === 0}
                onClick={() => submitAnswer(JSON.stringify(selectedMulti))}
                className="w-full shrink-0 rounded-2xl bg-primary py-3.5 font-bold text-white shadow-md disabled:opacity-50 active:scale-95"
              >
                Подтвердить
              </button>
            </div>
          )}

          {qtype === "true_false" && (
            <div className="grid flex-1 grid-cols-2 gap-3">
              {["Туура", "Жалган"].map((v, i) => {
                const isCorrectOpt = showResult && correctList.includes(v);
                const isSelected = selected === v;
                return (
                  <button
                    key={v}
                    disabled={answered}
                    onClick={() => { setSelected(v); submitAnswer(v); }}
                    className="flex min-h-[100px] flex-col items-center justify-center rounded-2xl border-2 font-extrabold text-white transition-all active:scale-95"
                    style={{
                      background: isCorrectOpt ? "#22c55e" : OPTION_COLORS[i] + (isSelected ? "ee" : "cc"),
                      borderColor: isCorrectOpt ? "#16a34a" : OPTION_COLORS[i],
                    }}
                  >
                    <span className="mb-1 text-3xl">{v === "Туура" ? "✅" : "❌"}</span>
                    {/* Значение (v), отправляемое на сервер, остаётся "Туура"/"Жалган" —
                        совместимость со старыми вопросами в базе; переводим только подпись */}
                    <span className="text-base">{v === "Туура" ? "Верно" : "Неверно"}</span>
                  </button>
                );
              })}
            </div>
          )}

          {(qtype === "text" || qtype === "fill_blank") && (
            <div className="flex flex-1 flex-col justify-center gap-3">
              <input
                value={textAnswer}
                onChange={(e) => setTextAnswer(e.target.value)}
                disabled={answered}
                placeholder={qtype === "fill_blank" ? "Впишите пропущенное слово..." : "Введите ваш ответ..."}
                className="w-full rounded-2xl bg-white px-4 py-4 text-center text-base text-midnight_text placeholder:text-grey/60 border border-slate-200 shadow-sm focus:border-primary focus:outline-none"
              />
              <button
                disabled={answered || !textAnswer.trim()}
                onClick={() => submitAnswer(textAnswer)}
                className="w-full rounded-2xl bg-primary py-3.5 font-bold text-white shadow-md disabled:opacity-50 active:scale-95"
              >
                Ответить
              </button>
            </div>
          )}

          {qtype === "essay" && (
            <div className="flex flex-1 flex-col gap-2">
              <textarea
                value={essayAnswer}
                onChange={(e) => setEssayAnswer(e.target.value)}
                disabled={answered}
                placeholder="Развёрнутый ответ..."
                className="min-h-0 flex-1 resize-none rounded-2xl bg-white px-4 py-3 text-sm text-midnight_text placeholder:text-grey/60 border border-slate-200 shadow-sm focus:border-primary focus:outline-none"
              />
              <button
                disabled={answered || !essayAnswer.trim()}
                onClick={() => submitAnswer(essayAnswer)}
                className="w-full shrink-0 rounded-2xl bg-primary py-3.5 font-bold text-white shadow-md disabled:opacity-50 active:scale-95"
              >
                Отправить (проверит преподаватель)
              </button>
            </div>
          )}

          {qtype === "media" && (
            <div className="flex flex-1 flex-col items-center justify-center gap-3">
              {!mediaUrl ? (
                <>
                  <label className="flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 bg-white py-8 text-grey">
                    <span className="text-3xl">📎</span>
                    <span className="text-sm">{mediaUploading ? "Загрузка..." : "Выбрать фото или аудио"}</span>
                    <input
                      type="file"
                      accept="image/*,audio/*"
                      disabled={answered || mediaUploading}
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && uploadMedia(e.target.files[0])}
                    />
                  </label>
                  {mediaError && <p className="text-sm text-red-500">{mediaError}</p>}
                </>
              ) : (
                <>
                  {/\.(jpg|jpeg|png|webp)$/i.test(mediaUrl) ? (
                    <img src={mediaUrl} alt="ответ" className="max-h-[30dvh] rounded-2xl object-contain shadow-md" />
                  ) : (
                    <audio src={mediaUrl} controls className="w-full" />
                  )}
                  <button
                    disabled={answered}
                    onClick={() => submitAnswer(mediaUrl)}
                    className="w-full shrink-0 rounded-2xl bg-primary py-3.5 font-bold text-white shadow-md disabled:opacity-50 active:scale-95"
                  >
                    Отправить ответ
                  </button>
                  {!answered && (
                    <button onClick={() => setMediaUrl(null)} className="text-xs text-grey underline">Выбрать другой файл</button>
                  )}
                </>
              )}
            </div>
          )}

          {qtype === "ordering" && (
            <div className="flex flex-1 flex-col gap-2">
              <p className="shrink-0 text-center text-xs text-grey">Нажимайте по порядку</p>
              <div className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto">
                {orderPicked.map((item, i) => (
                  <div key={`picked-${item}`} className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 shadow-sm border border-slate-100">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">{i + 1}</span>
                    <span className="text-sm font-semibold text-midnight_text">{item}</span>
                  </div>
                ))}
                {orderOpts.filter((o) => !orderPicked.includes(o)).map((item) => (
                  <button
                    key={item}
                    disabled={answered}
                    onClick={() => pickOrderItem(item)}
                    className="rounded-xl border-2 border-slate-200 bg-white px-3 py-2.5 text-left text-sm font-semibold text-midnight_text shadow-sm active:scale-95"
                  >
                    {item}
                  </button>
                ))}
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  disabled={answered || orderPicked.length === 0}
                  onClick={resetOrder}
                  className="flex-1 rounded-2xl border border-slate-300 py-3 text-sm font-semibold text-grey disabled:opacity-40"
                >
                  Сбросить
                </button>
                <button
                  disabled={answered || orderPicked.length !== orderOpts.length}
                  onClick={() => submitAnswer(JSON.stringify(orderPicked))}
                  className="flex-[2] rounded-2xl bg-primary py-3 font-bold text-white shadow-md disabled:opacity-50 active:scale-95"
                >
                  Подтвердить
                </button>
              </div>
            </div>
          )}

          {qtype === "matching" && (
            <div className="flex min-h-0 flex-1 gap-2 overflow-y-auto">
              <div className="flex flex-1 flex-col gap-1.5">
                {matchOpts.left.map((l, i) => (
                  <button
                    key={l}
                    disabled={answered}
                    onClick={() => setMatchActiveLeft(i)}
                    className={`rounded-xl border-2 px-3 py-2.5 text-left text-sm font-semibold active:scale-95 ${matchActiveLeft === i ? "border-primary bg-primary/10 text-midnight_text" : "border-slate-200 bg-white text-midnight_text shadow-sm"}`}
                  >
                    {l}
                    {matchPairs[i] && <span className="ml-2 text-xs text-grey">→ {matchPairs[i]}</span>}
                  </button>
                ))}
              </div>
              <div className="flex flex-1 flex-col gap-1.5">
                {matchOpts.right.map((r) => {
                  const usedBy = Object.entries(matchPairs).find(([, v]) => v === r)?.[0];
                  return (
                    <button
                      key={r}
                      disabled={answered || matchActiveLeft === null}
                      onClick={() => matchActiveLeft !== null && pickMatch(matchActiveLeft, r)}
                      className={`rounded-xl border-2 px-3 py-2.5 text-left text-sm font-semibold active:scale-95 disabled:opacity-40 ${usedBy !== undefined ? "border-green-400 bg-green-50 text-green-700" : "border-slate-200 bg-white text-midnight_text shadow-sm"}`}
                    >
                      {r}
                    </button>
                  );
                })}
              </div>
              <div className="sr-only" />
            </div>
          )}
          {qtype === "matching" && (
            <button
              disabled={answered || Object.keys(matchPairs).length !== matchOpts.left.length}
              onClick={() => submitAnswer(JSON.stringify(matchOpts.left.map((_, i) => matchPairs[i])))}
              className="mt-2 w-full shrink-0 rounded-2xl bg-primary py-3.5 font-bold text-white shadow-md disabled:opacity-50 active:scale-95"
            >
              Подтвердить
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
