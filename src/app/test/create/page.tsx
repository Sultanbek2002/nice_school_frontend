"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Cookies from "js-cookie";
import { GO_API_URL } from "@/utils/apiData";
import { Suspense } from "react";

interface Question {
  ID?: number;
  text: string;
  type: string;
  options: string[];
  correct: string[];
  points: number;
  time_limit: number;
  order: number;
  _editing?: boolean;
}

interface LiveTest {
  ID: number;
  code: string;
  title: string;
  description: string;
  status: string;
}

const QTYPES = [
  { value: "single", label: "Бир туура жооп" },
  { value: "multiple", label: "Бир нече туура жооп" },
  { value: "true_false", label: "Туура / Жалган" },
  { value: "text", label: "Текст жооп" },
];

function emptyQuestion(order: number): Question {
  return {
    text: "",
    type: "single",
    options: ["", "", "", ""],
    correct: [],
    points: 10,
    time_limit: 30,
    order,
    _editing: true,
  };
}

function CreateTestInner() {
  const router = useRouter();
  const params = useSearchParams();
  const editCode = params.get("code");

  const [test, setTest] = useState<LiveTest | null>(null);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [saving, setSaving] = useState(false);
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState("");
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const token = Cookies.get("auth_token");

  useEffect(() => {
    if (!token) { router.push("/student"); return; }
    if (!editCode) return;
    fetch(`${GO_API_URL}/api/live-test/${editCode}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(({ test, questions }) => {
        setTest(test);
        setTitle(test.title);
        setDesc(test.description || "");
        const qs: Question[] = (questions || []).map((q: any) => ({
          ID: q.ID,
          text: q.text,
          type: q.type || "single",
          options: tryParseArr(q.options) || ["", "", "", ""],
          correct: tryParseArr(q.correct) || [],
          points: q.points || 10,
          time_limit: q.time_limit || 30,
          order: q.order,
          _editing: false,
        }));
        setQuestions(qs);
      })
      .catch(() => setError("Жүктөп алуу катасы"));
  }, [editCode]);

  const tryParseArr = (s: string): string[] | null => {
    try { return JSON.parse(s); } catch { return null; }
  };

  const safeJson = async (res: Response) => {
    const text = await res.text();
    try { return JSON.parse(text); } catch { throw new Error(res.ok ? "Сервер жооп бербеди" : `Сервер катасы ${res.status}`); }
  };

  const saveTest = async () => {
    if (!title.trim()) { setError("Аталышты жазыңыз"); return; }
    setSaving(true); setError("");
    try {
      let current = test;
      if (!current) {
        const res = await fetch(`${GO_API_URL}/api/live-tests`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ title, description: desc }),
        });
        const data = await safeJson(res);
        if (!res.ok) throw new Error(data?.error || "Тест түзүлгөн жок");
        current = data;
        setTest(data);
      } else {
        const res = await fetch(`${GO_API_URL}/api/live-test/${current.code}`, {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ title, description: desc }),
        });
        if (!res.ok) throw new Error("Сактоо катасы");
      }
      // sync questions with IDs
      const newQs: Question[] = [];
      for (const q of questions) {
        if (!q.text.trim()) continue;
        const body = {
          text: q.text,
          type: q.type,
          options: JSON.stringify(q.options.filter(Boolean)),
          correct: JSON.stringify(q.correct.filter(Boolean)),
          points: q.points,
          time_limit: q.time_limit,
          order: q.order,
        };
        if (q.ID) {
          await fetch(`${GO_API_URL}/api/live-test/${current!.code}/questions/${q.ID}`, {
            method: "PUT",
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
          newQs.push({ ...q, _editing: false });
        } else {
          const res = await fetch(`${GO_API_URL}/api/live-test/${current!.code}/questions`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
          const data = await safeJson(res);
          newQs.push({ ...q, ID: data?.ID, _editing: false });
        }
      }
      setQuestions(newQs);
      if (!editCode && current?.code) router.replace(`/test/create?code=${current.code}`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const openTest = async () => {
    if (!test) { await saveTest(); return; }
    setOpening(true); setError("");
    try {
      const code = test.code;
      const res = await fetch(`${GO_API_URL}/api/live-test/${code}/open`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await safeJson(res);
      if (!res.ok) throw new Error(data?.error || "Ача алган жок");
      router.push(`/test/${code}/monitor`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setOpening(false);
    }
  };

  const deleteQuestion = async (q: Question, idx: number) => {
    if (q.ID && test) {
      await fetch(`${GO_API_URL}/api/live-test/${test.code}/questions/${q.ID}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
    }
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  const importExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!test || !e.target.files?.[0]) return;
    setImporting(true);
    const fd = new FormData();
    fd.append("file", e.target.files[0]);
    try {
      const res = await fetch(`${GO_API_URL}/api/live-test/${test.code}/questions/import`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      // Reload questions
      const r2 = await fetch(`${GO_API_URL}/api/live-test/${test.code}`);
      const { questions: qs } = await r2.json();
      setQuestions((qs || []).map((q: any) => ({
        ID: q.ID, text: q.text, type: q.type || "single",
        options: tryParseArr(q.options) || [],
        correct: tryParseArr(q.correct) || [],
        points: q.points, time_limit: q.time_limit, order: q.order,
        _editing: false,
      })));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const updateQ = (idx: number, patch: Partial<Question>) => {
    setQuestions((prev) => prev.map((q, i) => i === idx ? { ...q, ...patch } : q));
  };

  const toggleOption = (q: Question, idx: number, opt: string) => {
    if (q.type === "single" || q.type === "true_false") {
      return [opt];
    }
    const existing = q.correct.includes(opt);
    if (existing) return q.correct.filter((c) => c !== opt);
    return [...q.correct, opt];
  };

  return (
    <div className="min-h-screen bg-slate-gray px-3 py-6 sm:px-4 sm:py-10">
      <div className="mx-auto max-w-2xl">
        <div className="mb-5 flex items-center gap-3">
          <button
            onClick={() => router.push("/test")}
            className="shrink-0 text-grey hover:text-midnight_text"
          >
            ← Артка
          </button>
          <h1 className="min-w-0 truncate text-xl font-extrabold text-midnight_text sm:text-2xl">
            {test ? "Тестти түзөтүү" : "Жаңы тест"}
          </h1>
          {test && (
            <span className="ml-auto shrink-0 font-mono text-sm font-bold tracking-widest text-primary">
              {test.code}
            </span>
          )}
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</div>
        )}

        {/* Info */}
        <div className="glass-card mb-6 rounded-2xl p-5">
          <label className="mb-1 block text-sm font-semibold text-midnight_text">Аталышы *</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Кыргызстан тарыхы"
            className="mb-4 w-full rounded-xl border border-black/10 bg-white/80 px-3 py-2.5 text-midnight_text focus:border-primary focus:outline-none"
          />
          <label className="mb-1 block text-sm font-semibold text-midnight_text">Сүрөттөмө</label>
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Кыскача маалымат..."
            rows={2}
            className="w-full rounded-xl border border-black/10 bg-white/80 px-3 py-2.5 text-midnight_text focus:border-primary focus:outline-none resize-none"
          />
        </div>

        {/* Questions */}
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-bold text-midnight_text">
            Суроолор ({questions.length})
          </h2>
        </div>

        {/* Excel import row — shown after test is saved */}
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={importExcel}
        />
        <div className="mb-4 flex gap-2">
          <button
            onClick={() => {
              if (!test) { setError("Алгач тестти сактаңыз"); return; }
              fileRef.current?.click();
            }}
            disabled={importing}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-primary/40 bg-primary/5 py-3 text-sm font-semibold text-primary disabled:opacity-50 active:scale-95"
          >
            <span>📥</span>
            {importing ? "Импорт..." : "Excel импорт"}
          </button>
          <button
            onClick={() => {
              const a = document.createElement("a");
              a.href = `${GO_API_URL}/api/live-test/questions/template`;
              a.download = "live_test_template.xlsx";
              a.click();
            }}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-grey/30 bg-black/5 py-3 text-sm font-semibold text-grey active:scale-95"
          >
            <span>📄</span>
            Шаблон
          </button>
        </div>

        <div className="mb-4 flex flex-col gap-3">
          {questions.map((q, idx) => (
            <div key={idx} className="glass-card rounded-2xl p-4">
              {q._editing ? (
                <div>
                  <div className="mb-3">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="text-sm font-bold text-midnight_text">{idx + 1}.</span>
                      <select
                        value={q.type}
                        onChange={(e) => updateQ(idx, { type: e.target.value, correct: [] })}
                        className="min-w-0 flex-1 rounded-lg border border-black/10 bg-white/80 px-2 py-1.5 text-sm"
                      >
                        {QTYPES.map((t) => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex gap-3">
                      <div className="flex flex-1 items-center gap-2">
                        <label className="shrink-0 text-xs text-grey">Упай</label>
                        <input
                          type="number"
                          value={q.points}
                          onChange={(e) => updateQ(idx, { points: +e.target.value })}
                          className="w-full rounded-lg border border-black/10 bg-white/80 px-2 py-1.5 text-sm text-center"
                        />
                      </div>
                      <div className="flex flex-1 items-center gap-2">
                        <label className="shrink-0 text-xs text-grey">Убакыт(с)</label>
                        <input
                          type="number"
                          value={q.time_limit}
                          onChange={(e) => updateQ(idx, { time_limit: +e.target.value })}
                          className="w-full rounded-lg border border-black/10 bg-white/80 px-2 py-1.5 text-sm text-center"
                        />
                      </div>
                    </div>
                  </div>
                  <textarea
                    value={q.text}
                    onChange={(e) => updateQ(idx, { text: e.target.value })}
                    placeholder="Суроону жазыңыз..."
                    rows={2}
                    className="mb-3 w-full rounded-xl border border-black/10 bg-white/80 px-3 py-2.5 text-sm text-midnight_text focus:border-primary focus:outline-none resize-none"
                  />
                  {(q.type === "single" || q.type === "multiple") && (
                    <div className="grid grid-cols-1 gap-2 mb-3 sm:grid-cols-2">
                      {q.options.map((opt, oi) => (
                        <div key={oi} className="flex items-center gap-2">
                          <button
                            onClick={() => updateQ(idx, { correct: toggleOption(q, oi, opt) })}
                            className={`h-5 w-5 shrink-0 rounded-full border-2 ${q.correct.includes(opt) ? "border-primary bg-primary" : "border-gray-300 bg-white"}`}
                          />
                          <input
                            value={opt}
                            onChange={(e) => {
                              const newOpts = [...q.options];
                              newOpts[oi] = e.target.value;
                              // Update correct if this option text changes
                              const newCorrect = q.correct.map((c) =>
                                c === q.options[oi] ? e.target.value : c
                              );
                              updateQ(idx, { options: newOpts, correct: newCorrect });
                            }}
                            placeholder={`${oi + 1}-вариант`}
                            className="flex-1 rounded-lg border border-black/10 bg-white/80 px-2 py-1.5 text-sm"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                  {q.type === "true_false" && (
                    <div className="flex gap-3 mb-3">
                      {["Туура", "Жалган"].map((v) => (
                        <button
                          key={v}
                          onClick={() => updateQ(idx, { correct: [v] })}
                          className={`flex-1 rounded-xl py-2 text-sm font-semibold border-2 ${q.correct[0] === v ? "border-primary bg-primary text-white" : "border-gray-200 bg-white text-midnight_text"}`}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  )}
                  {q.type === "text" && (
                    <div className="mb-3">
                      <label className="mb-1 block text-xs text-grey">Туура жооп</label>
                      <input
                        value={q.correct[0] || ""}
                        onChange={(e) => updateQ(idx, { correct: [e.target.value] })}
                        placeholder="Туура жооп"
                        className="w-full rounded-xl border border-black/10 bg-white/80 px-3 py-2 text-sm"
                      />
                    </div>
                  )}
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => updateQ(idx, { _editing: false })}
                      className="rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20"
                    >
                      Даяр
                    </button>
                    <button
                      onClick={() => deleteQuestion(q, idx)}
                      className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-100"
                    >
                      Жок кылуу
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 text-sm font-bold text-grey">{idx + 1}.</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-midnight_text line-clamp-2">{q.text || <span className="text-grey italic">Суроо жазылган эмес</span>}</p>
                    <p className="mt-1 text-xs text-grey">{QTYPES.find((t) => t.value === q.type)?.label} · {q.points} упай · {q.time_limit}с</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateQ(idx, { _editing: true })}
                      className="text-xs text-primary hover:underline"
                    >
                      Түзөт
                    </button>
                    <button
                      onClick={() => deleteQuestion(q, idx)}
                      className="text-xs text-red-500 hover:underline"
                    >
                      Жок кыл
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={() => setQuestions((prev) => [...prev, emptyQuestion(prev.length + 1)])}
          className="mb-8 w-full rounded-xl border-2 border-dashed border-primary/30 py-3 text-sm font-semibold text-primary hover:bg-primary/5"
        >
          + Суроо кошуу
        </button>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={saveTest}
            disabled={saving}
            className="flex-1 rounded-xl border border-primary/30 py-3 font-semibold text-primary hover:bg-primary/5 disabled:opacity-50"
          >
            {saving ? "Сакталууда..." : "Сактоо"}
          </button>
          {test && test.status === "draft" && (
            <button
              onClick={openTest}
              disabled={opening || questions.length === 0}
              className="flex-1 rounded-xl bg-primary py-3 font-bold text-white hover:bg-primary/90 disabled:opacity-50"
            >
              {opening ? "..." : "Ачуу →"}
            </button>
          )}
          {test && test.status !== "draft" && (
            <button
              onClick={() => router.push(`/test/${test.code}/monitor`)}
              className="flex-1 rounded-xl bg-green-500 py-3 font-bold text-white hover:bg-green-600"
            >
              Монитор →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CreateTestPage() {
  return (
    <Suspense>
      <CreateTestInner />
    </Suspense>
  );
}
