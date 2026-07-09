"use client";
import React, { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { GO_API_URL } from "@/utils/apiData";

interface QDetail {
    question_id: number;
    type: string;
    text: string;
    image_url: string;
    options: string;
    points: number;
    correct_answer: string;
    given_answer: string;
    is_correct: boolean;
    manual_graded: boolean;
}
interface ResultDetail {
    id: number;
    olympiad_title: string;
    score: number;
    max_score: number;
    percentage: number;
    time_taken: number;
    admin_verified: boolean;
    created_at: string;
    questions: QDetail[];
}

function getToken() { return Cookies.get("auth_token") || ""; }
function fmtTime(sec: number) {
    const m = Math.floor(sec / 60), s = sec % 60;
    return `${m} мин ${s} сек`;
}

export default function MyResultDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = React.use(params);
    const router = useRouter();
    const [detail, setDetail] = useState<ResultDetail | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`${GO_API_URL}/api/my-test-results/${id}`, {
            headers: { Authorization: `Bearer ${getToken()}` },
        })
            .then(r => r.ok ? r.json() : null)
            .then(d => { if (d) setDetail(d); })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(145deg,#f0f4ff,#faf5ff)" }}>
            <div className="animate-spin w-10 h-10 border-2 border-violet-400 border-t-transparent rounded-full" />
        </div>
    );

    if (!detail) return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: "linear-gradient(145deg,#f0f4ff,#faf5ff)" }}>
            <div className="text-5xl">❌</div>
            <p className="text-slate-500 font-bold">Жыйынтык табылган жок</p>
            <button onClick={() => router.back()} className="px-5 py-2.5 bg-violet-500 text-white rounded-xl font-bold text-sm">← Артка</button>
        </div>
    );

    const pct = detail.percentage;
    const pctColor = pct >= 80 ? "#22c55e" : pct >= 60 ? "#a855f7" : pct >= 40 ? "#f59e0b" : "#ef4444";
    const LETTERS = ["А", "Б", "В", "Г", "Д"];

    return (
        <div className="min-h-screen pb-12">
            {/* Header */}
            <div className="sticky top-0 z-10 glass-nav px-4 py-3 flex items-center gap-3">
                <button onClick={() => router.back()}
                    className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors">
                    ←
                </button>
                <div className="min-w-0 flex-1">
                    <p className="font-black text-slate-800 text-sm truncate">{detail.olympiad_title}</p>
                    <p className="text-xs text-slate-400">{detail.created_at?.slice(0, 10)}</p>
                </div>
                {detail.admin_verified
                    ? <span className="flex-shrink-0 text-xs font-black px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700">✓ Текшерилген</span>
                    : <span className="flex-shrink-0 text-xs font-black px-3 py-1.5 rounded-full bg-amber-100 text-amber-700">⏳ Текшерилбеген</span>
                }
            </div>

            <div className="max-w-2xl mx-auto px-4 pt-6 space-y-4">
                {/* Score card */}
                <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
                    <div className="h-1.5 w-full" style={{ background: `linear-gradient(90deg,${pctColor},#818cf8)` }} />
                    <div className="p-6 flex items-center gap-6">
                        {/* Ring */}
                        <div className="relative w-24 h-24 flex-shrink-0">
                            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="40" fill="none" stroke="#f1f5f9" strokeWidth="8" />
                                <circle cx="50" cy="50" r="40" fill="none"
                                    stroke={pctColor} strokeWidth="8"
                                    strokeDasharray={`${2 * Math.PI * 40}`}
                                    strokeDashoffset={`${2 * Math.PI * 40 * (1 - pct / 100)}`}
                                    strokeLinecap="round"
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-xl font-black text-slate-800">{Math.round(pct)}%</span>
                            </div>
                        </div>
                        <div className="flex-1 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-slate-400 font-semibold">Упай</span>
                                <span className="text-lg font-black text-slate-800">{detail.score} / {detail.max_score}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-slate-400 font-semibold">Убакыт</span>
                                <span className="text-sm font-bold text-slate-600">{fmtTime(detail.time_taken)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-slate-400 font-semibold">Суроолор</span>
                                <span className="text-sm font-bold text-slate-600">{detail.questions.length} суроо</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Questions */}
                <h3 className="text-sm font-black text-slate-500 uppercase tracking-wider px-1">Суроолор жана жооптор</h3>

                {detail.questions.map((q, idx) => {
                    let opts: string[] = [];
                    try { opts = JSON.parse(q.options || "[]"); } catch { opts = []; }
                    const isOpen = q.type !== "multiple_choice";
                    const hasAnswer = !!q.given_answer;

                    // Border & badge color
                    let borderColor = "border-slate-200";
                    let badgeCls = "bg-slate-100 text-slate-500";
                    let statusLabel = "";

                    if (isOpen) {
                        if (!q.manual_graded) {
                            borderColor = "border-amber-200";
                            badgeCls = "bg-amber-100 text-amber-700";
                            statusLabel = "⏳ Баалоону күтүп жатат";
                        } else if (q.is_correct) {
                            borderColor = "border-emerald-300";
                            badgeCls = "bg-emerald-100 text-emerald-700";
                            statusLabel = `✓ Туура (+${q.points} упай)`;
                        } else {
                            borderColor = "border-red-200";
                            badgeCls = "bg-red-50 text-red-600";
                            statusLabel = "✕ Туура эмес";
                        }
                    } else {
                        if (q.is_correct) {
                            borderColor = "border-emerald-300";
                            badgeCls = "bg-emerald-100 text-emerald-700";
                            statusLabel = `✓ Туура (+${q.points} упай)`;
                        } else {
                            borderColor = "border-red-200";
                            badgeCls = "bg-red-50 text-red-600";
                            statusLabel = "✕ Туура эмес";
                        }
                    }

                    return (
                        <div key={q.question_id} className={`bg-white rounded-2xl border-2 overflow-hidden shadow-sm ${borderColor}`}>
                            {/* Header */}
                            <div className="px-4 py-2.5 border-b border-slate-100 flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 text-xs font-black flex items-center justify-center flex-shrink-0">
                                    {idx + 1}
                                </span>
                                <span className={`text-xs font-black px-2.5 py-1 rounded-full ${badgeCls}`}>{statusLabel}</span>
                                <span className="ml-auto text-xs text-slate-400 font-semibold">{q.points} упай</span>
                            </div>

                            <div className="p-4 space-y-3">
                                <p className="text-sm font-semibold text-slate-800 leading-relaxed">{q.text}</p>

                                {q.image_url && (
                                    <img src={q.image_url} alt="" className="w-full max-h-48 object-contain rounded-xl bg-slate-50" />
                                )}

                                {isOpen ? (
                                    /* Open question */
                                    <div className="space-y-2">
                                        <div className={`p-3 rounded-xl border text-sm ${hasAnswer ? "border-slate-200 bg-slate-50 text-slate-700" : "border-dashed border-slate-200 text-slate-400"}`}>
                                            <p className="text-xs font-black text-slate-400 mb-1">Менин жообум:</p>
                                            <p className="font-medium">{q.given_answer || "Жооп берилген жок"}</p>
                                        </div>
                                        {q.manual_graded && q.correct_answer && (
                                            <div className="p-3 rounded-xl border border-indigo-100 bg-indigo-50 text-sm">
                                                <p className="text-xs font-black text-indigo-400 mb-1">Туура жооп:</p>
                                                <p className="text-indigo-700 font-semibold">{q.correct_answer}</p>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    /* Multiple choice */
                                    <div className="space-y-1.5">
                                        {opts.map((opt, oi) => {
                                            const isCorrect = opt === q.correct_answer;
                                            const isGiven = opt === q.given_answer;
                                            let cls = "border-slate-100 bg-slate-50 text-slate-500";
                                            let dotCls = "bg-slate-200 text-slate-500";
                                            if (isCorrect && isGiven) { cls = "border-emerald-300 bg-emerald-50 text-emerald-800"; dotCls = "bg-emerald-500 text-white"; }
                                            else if (isCorrect)       { cls = "border-emerald-200 bg-emerald-50 text-emerald-700"; dotCls = "bg-emerald-400 text-white"; }
                                            else if (isGiven)         { cls = "border-red-200 bg-red-50 text-red-700"; dotCls = "bg-red-400 text-white"; }

                                            return (
                                                <div key={oi} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 text-sm font-semibold ${cls}`}>
                                                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0 ${dotCls}`}>
                                                        {LETTERS[oi] ?? String.fromCharCode(65 + oi)}
                                                    </span>
                                                    <span className="flex-1">{opt}</span>
                                                    {isCorrect && <span className="text-xs font-black text-emerald-600 flex-shrink-0">✓ Туура</span>}
                                                    {isGiven && !isCorrect && <span className="text-xs font-black text-red-500 flex-shrink-0">← Менин жообум</span>}
                                                </div>
                                            );
                                        })}
                                        {!hasAnswer && <p className="text-xs text-slate-400 font-semibold px-1">Жооп берилген жок</p>}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
