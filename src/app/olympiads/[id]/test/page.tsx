"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import Cookies from "js-cookie";
import { GO_API_URL } from "@/utils/apiData";

// ─── Types ───────────────────────────────────────────────
interface Olympiad {
    ID: number; title: string; subject: string; time_limit: number; status: string; start_time: string | null;
}
interface Question {
    id: number; type: string; text: string; image_url: string;
    hint: string; options: string; points: number; order_num: number;
}
interface SubmitResult {
    score: number; max_score: number; percentage: number; result_id: number;
}

type Stage =
    | "loading"       // fetching olympiad + app info
    | "face-setup"    // first-time / re-registration face scan (no stored descriptor)
    | "face-check"    // camera verification (up to 3 attempts)
    | "testing"       // timer + questions
    | "submitted"     // result screen
    | "blocked"       // 3 attempts failed
    | "no-access"     // app not approved / olympiad not active
    | "already-done"; // already submitted

const MAX_ATTEMPTS = 3;
const MODEL_URL = "/face-models";

function getToken() { return Cookies.get("auth_token") || ""; }

// ─── Component ────────────────────────────────────────────
export default function TestPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = React.use(params);
    const [olympiad,   setOlympiad]  = useState<Olympiad | null>(null);
    const [questions,  setQuestions] = useState<Question[]>([]);
    const [stage,      setStage]     = useState<Stage>("loading");
    const [noAccessMsg, setNoAccessMsg] = useState("");

    // Face check
    const [mpReady,     setMpReady]    = useState(false);
    const [mpLoading,   setMpLoading]  = useState(false);
    const [camError,    setCamError]   = useState("");
    const [attempts,    setAttempts]   = useState(0);
    const [verifying,   setVerifying]  = useState(false);
    const [faceMsg,     setFaceMsg]    = useState("");
    const [faceMsgType, setFaceMsgType] = useState<"info"|"error"|"ok">("info");
    const [capturing,   setCapturing]  = useState(false);
    const [countdown,   setCountdown]  = useState(0);

    const videoRef   = useRef<HTMLVideoElement>(null);
    const canvasRef  = useRef<HTMLCanvasElement>(null);
    const streamRef  = useRef<MediaStream | null>(null);
    const rafRef     = useRef<number>(0);
    const landmarkRef = useRef<import("@mediapipe/tasks-vision").FaceLandmarker | null>(null);
    const stableRef  = useRef(0);
    const cdRunRef   = useRef(false);
    const attemptsRef = useRef(0);  // ref so captureAndVerify always sees current count
    const blockedRef  = useRef(false); // set true after max attempts to stop RAF immediately

    // Quiz
    const [answers,   setAnswers]   = useState<Record<number, string>>({});
    const [timeLeft,  setTimeLeft]  = useState(0);
    const [startedAt, setStartedAt] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [result,    setResult]    = useState<SubmitResult | null>(null);

    // ── 1. Load olympiad + check access ──────────────────
    useEffect(() => {
        const token = getToken();
        if (!token) { setNoAccessMsg("Кирүү талап кылынат"); setStage("no-access"); return; }

        const safeFetch = (url: string, opts?: RequestInit) =>
            fetch(url, opts)
                .then(r => r.ok ? r.json().catch(() => null) : null)
                .catch(() => null);

        Promise.all([
            safeFetch(`${GO_API_URL}/api/olympiads/${id}`),
            safeFetch(`${GO_API_URL}/api/olympiads/${id}/my-application`, {
                headers: { Authorization: `Bearer ${token}` },
            }),
            safeFetch(`${GO_API_URL}/api/olympiads/${id}/my-result`, {
                headers: { Authorization: `Bearer ${token}` },
            }),
        ]).then(([olym, app, existingResult]) => {
            if (!olym) { setNoAccessMsg("Олимпиада табылган жок"); setStage("no-access"); return; }
            setOlympiad(olym);
            setTimeLeft((olym.time_limit || 60) * 60);

            if (existingResult?.completed) {
                setResult(existingResult);
                setStage("already-done");
                return;
            }

            if (olym.start_time) {
                const deadline = new Date(olym.start_time).getTime() + (olym.time_limit || 60) * 60000;
                if (Date.now() > deadline) {
                    setNoAccessMsg("Олимпиаданын убактысы аяктады");
                    setStage("no-access");
                    return;
                }
            }

            if (!app || app.status !== "approved") {
                setNoAccessMsg(
                    !app ? "Сиз бул олимпиадага катталган жоксуз" :
                    app.status === "pending" ? "Өтүнүчүңүз дагы эле текшерилүүдө" :
                    "Өтүнүчүңүз четке кагылды"
                );
                setStage("no-access");
                return;
            }
            setStage(app.face_embeddings ? "face-check" : "face-setup");
        }).catch(() => {
            setNoAccessMsg("Маалыматтарды жүктөөдө ката кетти. Баракты кайра жүктөңүз.");
            setStage("no-access");
        });
    }, [id]);

    // ── 2. MediaPipe for face detection during verification ──
    const loadMediaPipe = useCallback(async () => {
        if (landmarkRef.current || mpLoading) return;
        setMpLoading(true);
        try {
            const { FaceLandmarker, FilesetResolver } = await import("@mediapipe/tasks-vision");
            const vision = await FilesetResolver.forVisionTasks(
                "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
            );
            landmarkRef.current = await FaceLandmarker.createFromOptions(vision, {
                baseOptions: {
                    modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
                    delegate: "GPU",
                },
                runningMode: "VIDEO",
                numFaces: 1,
            });
            setMpReady(true);
        } catch { setCamError("AI моделин жүктөөдө ката. Интернет туташуусун текшериңиз."); }
        finally { setMpLoading(false); }
    }, [mpLoading]);

    const startCamera = useCallback(async () => {
        setCamError("");
        try {
            const s = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
            });
            streamRef.current = s;
            const video = videoRef.current;
            if (video) {
                video.srcObject = s;
                await new Promise<void>(resolve => {
                    if (video.readyState >= 1) { resolve(); return; }
                    video.onloadedmetadata = () => resolve();
                });
                await video.play().catch(() => {});
            }
        } catch { setCamError("Камерага уруксат жок. Браузер жөндөөлөрүнөн уруксат бериңиз."); }
    }, []);

    const stopCamera = useCallback(() => {
        cancelAnimationFrame(rafRef.current);
        streamRef.current?.getTracks().forEach(t => t.stop());
        streamRef.current = null;
    }, []);

    // Start camera when entering face-check / face-setup stage
    useEffect(() => {
        if (stage === "face-check" || stage === "face-setup") {
            startCamera();
            loadMediaPipe();
        } else {
            stopCamera();
        }
        return () => stopCamera();
    }, [stage, startCamera, stopCamera, loadMediaPipe]);

    // RAF loop — face detection for auto-capture
    useEffect(() => {
        if ((stage !== "face-check" && stage !== "face-setup") || !mpReady || verifying || capturing || camError || blockedRef.current) return;
        let active = true;
        let lastTs = -1;

        const loop = (ts: number) => {
            if (!active) return;
            const video = videoRef.current;
            const lm = landmarkRef.current;
            if (video && lm && video.readyState >= 3 && !video.paused && ts !== lastTs) {
                lastTs = ts;
                try {
                    const res = lm.detectForVideo(video, ts);
                    if (res.faceLandmarks && res.faceLandmarks.length > 0) {
                        const pts = res.faceLandmarks[0];
                        const left = pts[33], right = pts[263], nose = pts[4];
                        const midX = (left.x + right.x) / 2;
                        const eyeW = Math.abs(right.x - left.x);
                        const yaw  = eyeW > 0.01 ? (nose.x - midX) / eyeW : 0;
                        const frontOk = yaw >= -0.12 && yaw <= 0.12;

                        if (frontOk && !cdRunRef.current) {
                            stableRef.current++;
                            if (stableRef.current >= 30) {
                                stableRef.current = 0;
                                cdRunRef.current = true;
                                setCapturing(true);
                                setCountdown(3);
                            }
                        } else if (!frontOk) {
                            stableRef.current = 0;
                        }
                    } else {
                        stableRef.current = 0;
                    }
                } catch { /* not ready */ }
            }
            rafRef.current = requestAnimationFrame(loop);
        };
        rafRef.current = requestAnimationFrame(loop);
        return () => { active = false; cancelAnimationFrame(rafRef.current); };
    }, [stage, mpReady, verifying, capturing, camError]);

    // Countdown → capture → verify
    useEffect(() => {
        if (countdown <= 0) return;
        if (countdown === 1) {
            const t = setTimeout(() => captureAndVerify(), 600);
            return () => clearTimeout(t);
        }
        const t = setTimeout(() => setCountdown(c => c - 1), 1000);
        return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [countdown]);

    const captureAndVerify = async () => {
        const video = videoRef.current;
        if (!video) return;
        const isSetup = stage === "face-setup";

        setCountdown(0);
        setCapturing(false);
        cdRunRef.current = false;
        stableRef.current = 0;
        setVerifying(true);
        setFaceMsg(isSetup ? "Жүзүңүз сакталууда..." : "Жүзүңүз текшерилүүдө...");
        setFaceMsgType("info");

        try {
            // Extract descriptor directly from video (avoids JPEG compression artifacts)
            const faceapi = await import("@vladmandic/face-api");
            if (!faceapi.nets.ssdMobilenetv1.isLoaded) {
                await Promise.all([
                    faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
                    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
                ]);
            }
            // Detect from live video element — no JPEG compression, best quality
            const det = await faceapi.detectSingleFace(video).withFaceLandmarks().withFaceDescriptor();

            if (!det) {
                if (isSetup) {
                    setFaceMsg("Жүзүңүз аныкталган жок. Жарык жерде, камерага жакыныраак туруңуз.");
                    setFaceMsgType("error");
                    return;
                }
                attemptsRef.current += 1;
                const a = attemptsRef.current;
                setAttempts(a);
                setFaceMsg(`Жүзүңүз аныкталган жок. Жарык жерде, камерага жакыныраак туруңуз. (${a}/${MAX_ATTEMPTS})`);
                setFaceMsgType("error");
                if (a >= MAX_ATTEMPTS) { blockedRef.current = true; setStage("blocked"); }
                return;
            }

            const descriptor = Array.from(det.descriptor);

            if (isSetup) {
                const res = await fetch(`${GO_API_URL}/api/olympiads/${id}/update-face`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
                    body: JSON.stringify({ descriptor }),
                });
                if (res.status === 403) {
                    const data = await res.json().catch(() => null);
                    setNoAccessMsg(data?.error || "Олимпиаданын убактысы аяктады");
                    setStage("no-access");
                } else if (res.ok) {
                    setFaceMsg("Жүз маалыматы сакталды! Эми верификациядан өтүңүз.");
                    setFaceMsgType("ok");
                    setTimeout(() => setStage("face-check"), 1000);
                } else {
                    setFaceMsg("Сактоодо ката. Кайра аракет кылыңыз.");
                    setFaceMsgType("error");
                }
                return;
            }

            // Compare with backend
            const res = await fetch(`${GO_API_URL}/api/olympiads/${id}/verify-face`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
                body: JSON.stringify({ descriptor }),
            });
            const data = await res.json();

            if (res.status === 403) {
                blockedRef.current = true;
                setNoAccessMsg(data.error || "Олимпиаданын убактысы аяктады");
                setStage("no-access");
                return;
            }

            if (res.ok && data.match) {
                setFaceMsg("Верификация ийгиликтүү! Тест башталды.");
                setFaceMsgType("ok");
                // Load questions then go to testing
                const qRes = await fetch(`${GO_API_URL}/api/olympiads/${id}/test-questions`, {
                    headers: { Authorization: `Bearer ${getToken()}` },
                });
                if (qRes.ok) {
                    const qs = await qRes.json();
                    setQuestions(qs);
                    setStartedAt(Date.now());
                    setTimeout(() => setStage("testing"), 1000);
                }
            } else {
                attemptsRef.current += 1;
                const a = attemptsRef.current;
                setAttempts(a);
                if (!res.ok) {
                    setFaceMsg(data.error || "Текшерүүдө ката. Кайра аракет кылыңыз.");
                } else {
                    const score = data.score != null ? ` (айырма: ${data.score.toFixed(3)})` : "";
                    setFaceMsg(`Жүзүңүз дал келген жок${score}. Камерага жакын келип, жакшы жарыкта туруңуз. (${a}/${MAX_ATTEMPTS})`);
                }
                setFaceMsgType("error");
                if (a >= MAX_ATTEMPTS) {
                    blockedRef.current = true; // immediately stop RAF from triggering more attempts
                    fetch(`${GO_API_URL}/api/olympiads/${id}/report-face-fail`, {
                        method: "POST",
                        headers: { Authorization: `Bearer ${getToken()}` },
                    }).catch(() => {});
                    setTimeout(() => setStage("blocked"), 1200);
                }
            }
        } catch (e) {
            console.error(e);
            setFaceMsg("Текшерүүдө ката кетти. Кайра аракет кылыңыз.");
            setFaceMsgType("error");
            if (!isSetup) {
                attemptsRef.current += 1;
                setAttempts(attemptsRef.current);
            }
        } finally {
            setVerifying(false);
        }
    };

    // ── Timer ──────────────────────────────────────────────
    useEffect(() => {
        if (stage !== "testing") return;
        const iv = setInterval(() => {
            setTimeLeft(t => {
                if (t <= 1) { clearInterval(iv); handleSubmit(true); return 0; }
                return t - 1;
            });
        }, 1000);
        return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [stage]);

    const handleSubmit = async (auto = false) => {
        if (submitting) return;
        if (!auto && stage !== "testing") return;
        setSubmitting(true);
        const timeTaken = Math.round((Date.now() - startedAt) / 1000);
        const strAnswers: Record<string, string> = {};
        Object.entries(answers).forEach(([k, v]) => { strAnswers[k] = v; });

        try {
            const res = await fetch(`${GO_API_URL}/api/olympiads/${id}/submit-test`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
                body: JSON.stringify({ answers: strAnswers, time_taken: timeTaken }),
            });
            const data = await res.json();
            if (res.ok) { setResult(data); setStage("submitted"); }
        } finally { setSubmitting(false); }
    };

    const fmtTime = (s: number) => {
        const m = Math.floor(s / 60), sec = s % 60;
        return `${m.toString().padStart(2,"0")}:${sec.toString().padStart(2,"0")}`;
    };

    const answeredCount = Object.keys(answers).length;
    const progressPct   = questions.length ? Math.round(answeredCount / questions.length * 100) : 0;

    // ── Renders ────────────────────────────────────────────
    if (stage === "loading") return (
        <div className="min-h-screen flex items-center justify-center" style={{ background:"linear-gradient(145deg,#f0f4ff,#faf5ff)" }}>
            <div className="text-center">
                <div className="animate-spin w-10 h-10 border-2 border-violet-400 border-t-transparent rounded-full mx-auto mb-3" />
                <p className="text-slate-500 font-bold">Жүктөлүүдө...</p>
            </div>
        </div>
    );

    if (stage === "no-access") return (
        <div className="min-h-screen flex items-center justify-center" style={{ background:"linear-gradient(145deg,#f0f4ff,#faf5ff)" }}>
            <div className="bg-white rounded-3xl p-10 shadow-xl text-center max-w-md w-full mx-4">
                <div className="text-6xl mb-4">🔒</div>
                <h2 className="text-2xl font-black text-slate-800 mb-3">Уруксат жок</h2>
                <p className="text-slate-500 font-medium mb-6">{noAccessMsg}</p>
                <a href={`/olympiads/${id}`} className="inline-block px-6 py-3 rounded-2xl text-white font-bold" style={{ background:"linear-gradient(135deg,#7c3aed,#0ea5e9)" }}>
                    ← Олимпиадага кайтуу
                </a>
            </div>
        </div>
    );

    if (stage === "already-done") return (
        <div className="min-h-screen flex items-center justify-center" style={{ background:"linear-gradient(145deg,#f0f4ff,#faf5ff)" }}>
            <div className="bg-white rounded-3xl p-10 shadow-xl text-center max-w-md w-full mx-4">
                <div className="text-6xl mb-4">✅</div>
                <h2 className="text-2xl font-black text-slate-800 mb-2">Тест тапшырылган</h2>
                <p className="text-slate-500 mb-6">Сиз бул тестти мурун тапшырдыңыз</p>
                <a href={`/olympiads/${id}`} className="inline-block px-6 py-3 rounded-2xl text-white font-bold" style={{ background:"linear-gradient(135deg,#7c3aed,#0ea5e9)" }}>
                    ← Кайтуу
                </a>
            </div>
        </div>
    );

    if (stage === "blocked") return (
        <div className="min-h-screen flex items-center justify-center" style={{ background:"linear-gradient(145deg,#fff0f0,#faf0ff)" }}>
            <div className="bg-white rounded-3xl p-10 shadow-xl text-center max-w-md w-full mx-4">
                <div className="text-6xl mb-4">🚫</div>
                <h2 className="text-2xl font-black text-red-700 mb-3">Кирүү бөгөттөлдү</h2>
                <p className="text-slate-500 font-medium mb-2">{MAX_ATTEMPTS} жолу верификация ийгиликсиз болду.</p>
                <p className="text-sm text-slate-400 mb-6">Администратор менен байланышыңыз.</p>
                <a href={`/olympiads/${id}`} className="inline-block px-6 py-3 rounded-2xl text-white font-bold bg-red-500 hover:bg-red-600 transition-colors">
                    ← Кайтуу
                </a>
            </div>
        </div>
    );

    if (stage === "submitted" && result) return (
        <div className="min-h-screen flex items-center justify-center pb-10 pt-20" style={{ background:"linear-gradient(145deg,#f0f4ff,#faf5ff)" }}>
            <div className="bg-white rounded-3xl shadow-xl max-w-md w-full mx-4 overflow-hidden">
                {/* Result header */}
                <div className="p-8 text-white text-center" style={{ background:"linear-gradient(135deg,#7c3aed,#0ea5e9)" }}>
                    <div className="text-5xl mb-3">
                        {result.percentage >= 80 ? "🏆" : result.percentage >= 60 ? "🎉" : result.percentage >= 40 ? "📚" : "💪"}
                    </div>
                    <h2 className="text-2xl font-black mb-1">Тест аяктады!</h2>
                    <p className="text-white/80 text-sm">{olympiad?.title}</p>
                </div>
                <div className="p-8 space-y-5">
                    {/* Score ring */}
                    <div className="flex items-center justify-center">
                        <div className="relative w-32 h-32">
                            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                                <circle cx="60" cy="60" r="50" fill="none" stroke="#f1f5f9" strokeWidth="10" />
                                <circle cx="60" cy="60" r="50" fill="none"
                                    stroke={result.percentage >= 80 ? "#22c55e" : result.percentage >= 60 ? "#a855f7" : result.percentage >= 40 ? "#f59e0b" : "#ef4444"}
                                    strokeWidth="10"
                                    strokeDasharray={`${2 * Math.PI * 50}`}
                                    strokeDashoffset={`${2 * Math.PI * 50 * (1 - result.percentage / 100)}`}
                                    strokeLinecap="round"
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-2xl font-black text-slate-800">{Math.round(result.percentage)}%</span>
                                <span className="text-xs text-slate-400 font-bold">УПАЙ</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { label: "Туура жооп",  value: `${result.score} / ${result.max_score}`, icon: "✓" },
                            { label: "Пайыздык",    value: `${Math.round(result.percentage)}%`,      icon: "%" },
                        ].map(({ label, value, icon }) => (
                            <div key={label} className="bg-slate-50 rounded-2xl p-4 text-center">
                                <div className="text-2xl font-black text-violet-600 mb-0.5">{icon}</div>
                                <div className="text-lg font-black text-slate-800">{value}</div>
                                <div className="text-xs text-slate-400 font-semibold">{label}</div>
                            </div>
                        ))}
                    </div>

                    <div className={`p-4 rounded-2xl text-center ${result.percentage >= 60 ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
                        <p className="font-black text-sm">
                            {result.percentage >= 80 ? "🌟 Мыкты натыйжа! Сиз сонун аткардыңыз." :
                             result.percentage >= 60 ? "👍 Жакшы натыйжа! Улантыңыз." :
                             result.percentage >= 40 ? "📖 Дагы бир аз окуу керек." :
                             "💪 Кайра аракет кылыңыз! Кийинкисинде жакшыраак болот."}
                        </p>
                    </div>

                    <a href={`/olympiads/${id}`} className="block w-full py-4 rounded-2xl font-black text-white text-center" style={{ background:"linear-gradient(135deg,#7c3aed,#0ea5e9)" }}>
                        Аяктоо
                    </a>
                </div>
            </div>
        </div>
    );

    // ── Face setup stage (no stored descriptor yet) ───────
    if (stage === "face-setup") return (
        <div className="min-h-screen flex items-center justify-center pb-10 pt-20" style={{ background:"linear-gradient(145deg,#f0f4ff,#faf5ff)" }}>
            <div className="bg-white rounded-3xl shadow-xl max-w-sm w-full mx-4 overflow-hidden">
                <div className="p-5 border-b border-slate-100">
                    <h2 className="text-lg font-black text-slate-800 mb-1">Жүзүңүздү сактаңыз</h2>
                    <p className="text-xs text-slate-500">{olympiad?.title}</p>
                </div>

                <div className="p-5 space-y-4">
                    <div className="bg-violet-50 border border-violet-200 rounded-xl p-3">
                        <p className="text-xs font-bold text-violet-700">
                            ℹ️ Тестке кирүү үчүн жүз маалыматыңыз кайра сакталышы керек. Камерага тике карап туруңуз — авто тартылат.
                        </p>
                    </div>

                    {camError ? (
                        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
                            <p className="text-4xl mb-3">📷</p>
                            <p className="text-sm font-bold text-red-600 mb-4">{camError}</p>
                            <button onClick={() => { startCamera(); loadMediaPipe(); }}
                                className="px-5 py-2 bg-red-500 text-white rounded-xl font-bold text-sm">
                                Кайра аракет
                            </button>
                        </div>
                    ) : (
                        <div className="relative rounded-2xl overflow-hidden bg-slate-900" style={{ aspectRatio:"4/3" }}>
                            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
                            <canvas ref={canvasRef} className="hidden" />

                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="rounded-full transition-all duration-300"
                                    style={{
                                        width:"58%", height:"80%",
                                        border:`3px solid ${verifying ? "#a855f7" : capturing ? "#22c55e" : "#94a3b8"}`,
                                        boxShadow: capturing
                                            ? "0 0 0 2000px rgba(0,0,0,0.35), 0 0 24px 6px rgba(34,197,94,0.5)"
                                            : verifying
                                            ? "0 0 0 2000px rgba(0,0,0,0.5)"
                                            : "0 0 0 2000px rgba(0,0,0,0.45)",
                                    }} />
                            </div>

                            {countdown > 0 && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <span className="font-black text-white drop-shadow-2xl" style={{ fontSize:"5rem", lineHeight:1 }}>{countdown}</span>
                                </div>
                            )}

                            {verifying && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 pointer-events-none">
                                    <div className="animate-spin w-10 h-10 border-2 border-violet-400 border-t-transparent rounded-full mb-3" />
                                    <p className="text-white text-sm font-bold">Сакталууда...</p>
                                </div>
                            )}

                            <div className="absolute top-3 left-0 right-0 flex justify-center pointer-events-none">
                                <div className="bg-black/50 backdrop-blur-sm text-white text-xs font-bold px-4 py-2 rounded-full">
                                    {verifying ? "Сабыр кылыңыз..." : capturing ? "Жүзүңүздү кармап туруңуз..." : "Камерага тике карап туруңуз"}
                                </div>
                            </div>
                        </div>
                    )}

                    {mpLoading && (
                        <div className="bg-violet-50 border border-violet-200 rounded-xl p-3 flex items-center gap-3">
                            <div className="animate-spin w-4 h-4 border-2 border-violet-400 border-t-transparent rounded-full flex-shrink-0" />
                            <p className="text-xs font-bold text-violet-600">AI модели жүктөлүүдө...</p>
                        </div>
                    )}

                    {faceMsg && (
                        <div className={`rounded-xl p-3 text-sm font-bold ${
                            faceMsgType === "ok"    ? "bg-green-50 border border-green-200 text-green-700" :
                            faceMsgType === "error" ? "bg-red-50 border border-red-200 text-red-600" :
                                                      "bg-violet-50 border border-violet-200 text-violet-700"
                        }`}>
                            {faceMsgType === "ok" ? "✓ " : faceMsgType === "error" ? "✕ " : "ℹ "}{faceMsg}
                        </div>
                    )}

                    {!verifying && !capturing && mpReady && !camError && (
                        <button
                            onClick={() => { stableRef.current = 0; cdRunRef.current = true; setCapturing(true); setCountdown(3); }}
                            className="w-full py-3 rounded-2xl font-black text-white text-sm"
                            style={{ background:"linear-gradient(135deg,#7c3aed,#0ea5e9)" }}>
                            📸 Кол менен тартуу
                        </button>
                    )}
                </div>
            </div>
        </div>
    );

    // ── Face check stage ──────────────────────────────────
    if (stage === "face-check") return (
        <div className="min-h-screen flex items-center justify-center pb-10 pt-20" style={{ background:"linear-gradient(145deg,#f0f4ff,#faf5ff)" }}>
            <div className="bg-white rounded-3xl shadow-xl max-w-sm w-full mx-4 overflow-hidden">
                {/* Header */}
                <div className="p-5 border-b border-slate-100">
                    <div className="flex items-center justify-between mb-1">
                        <h2 className="text-lg font-black text-slate-800">Жүз верификациясы</h2>
                        <span className="text-xs font-bold text-slate-400">{MAX_ATTEMPTS - attempts} аракет калды</span>
                    </div>
                    <p className="text-xs text-slate-500">{olympiad?.title}</p>
                    {/* Attempt dots */}
                    <div className="flex gap-1.5 mt-3">
                        {Array.from({ length: MAX_ATTEMPTS }, (_, i) => (
                            <div key={i} className={`flex-1 h-1.5 rounded-full transition-all ${i < attempts ? "bg-red-400" : i === attempts ? "bg-violet-400 animate-pulse" : "bg-slate-200"}`} />
                        ))}
                    </div>
                </div>

                <div className="p-5 space-y-4">
                    {/* Camera */}
                    {camError ? (
                        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
                            <p className="text-4xl mb-3">📷</p>
                            <p className="text-sm font-bold text-red-600 mb-4">{camError}</p>
                            <button onClick={() => { startCamera(); loadMediaPipe(); }}
                                className="px-5 py-2 bg-red-500 text-white rounded-xl font-bold text-sm">
                                Кайра аракет
                            </button>
                        </div>
                    ) : (
                        <div className="relative rounded-2xl overflow-hidden bg-slate-900" style={{ aspectRatio:"4/3" }}>
                            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
                            <canvas ref={canvasRef} className="hidden" />

                            {/* Oval */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="rounded-full transition-all duration-300"
                                    style={{
                                        width:"58%", height:"80%",
                                        border:`3px solid ${verifying ? "#a855f7" : capturing ? "#22c55e" : "#94a3b8"}`,
                                        boxShadow: capturing
                                            ? "0 0 0 2000px rgba(0,0,0,0.35), 0 0 24px 6px rgba(34,197,94,0.5)"
                                            : verifying
                                            ? "0 0 0 2000px rgba(0,0,0,0.5)"
                                            : "0 0 0 2000px rgba(0,0,0,0.45)",
                                    }} />
                            </div>

                            {/* Countdown */}
                            {countdown > 0 && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <span className="font-black text-white drop-shadow-2xl" style={{ fontSize:"5rem", lineHeight:1 }}>{countdown}</span>
                                </div>
                            )}

                            {/* Verifying spinner */}
                            {verifying && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 pointer-events-none">
                                    <div className="animate-spin w-10 h-10 border-2 border-violet-400 border-t-transparent rounded-full mb-3" />
                                    <p className="text-white text-sm font-bold">Текшерилүүдө...</p>
                                </div>
                            )}

                            {/* Instruction */}
                            <div className="absolute top-3 left-0 right-0 flex justify-center pointer-events-none">
                                <div className="bg-black/50 backdrop-blur-sm text-white text-xs font-bold px-4 py-2 rounded-full">
                                    {verifying ? "Сабыр кылыңыз..." : capturing ? "Жүзүңүздү кармап туруңуз..." : "Камерага тике карап туруңуз"}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Loading MediaPipe */}
                    {mpLoading && (
                        <div className="bg-violet-50 border border-violet-200 rounded-xl p-3 flex items-center gap-3">
                            <div className="animate-spin w-4 h-4 border-2 border-violet-400 border-t-transparent rounded-full flex-shrink-0" />
                            <p className="text-xs font-bold text-violet-600">AI модели жүктөлүүдө...</p>
                        </div>
                    )}

                    {/* Status message */}
                    {faceMsg && (
                        <div className={`rounded-xl p-3 text-sm font-bold ${
                            faceMsgType === "ok"    ? "bg-green-50 border border-green-200 text-green-700" :
                            faceMsgType === "error" ? "bg-red-50 border border-red-200 text-red-600" :
                                                      "bg-violet-50 border border-violet-200 text-violet-700"
                        }`}>
                            {faceMsgType === "ok" ? "✓ " : faceMsgType === "error" ? "✕ " : "ℹ "}{faceMsg}
                        </div>
                    )}

                    {/* Manual capture */}
                    {!verifying && !capturing && mpReady && !camError && (
                        <button
                            onClick={() => { stableRef.current = 0; cdRunRef.current = true; setCapturing(true); setCountdown(3); }}
                            className="w-full py-3 rounded-2xl font-black text-white text-sm"
                            style={{ background:"linear-gradient(135deg,#7c3aed,#0ea5e9)" }}>
                            📸 Кол менен тартуу
                        </button>
                    )}

                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                        <p className="text-xs font-bold text-amber-700">
                            ⚠️ Каттоо учурундагы бир эле адам верификациядан өтүшү керек
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );

    // ── Testing stage ─────────────────────────────────────
    if (stage === "testing") {
        const urgent = timeLeft < 300; // < 5 min
        return (
            <div className="min-h-screen pb-32" style={{ background:"linear-gradient(145deg,#f0f4ff,#faf5ff)" }}>
                {/* Sticky top bar */}
                <div className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
                    <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
                        <div className="min-w-0">
                            <p className="text-xs text-slate-400 font-semibold truncate">{olympiad?.title}</p>
                            <p className="text-sm font-black text-slate-800">{answeredCount}/{questions.length} жоопторулду</p>
                        </div>

                        {/* Progress */}
                        <div className="flex-1 hidden sm:block">
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full rounded-full transition-all duration-300"
                                    style={{ width:`${progressPct}%`, background:"linear-gradient(135deg,#7c3aed,#0ea5e9)" }} />
                            </div>
                        </div>

                        {/* Timer */}
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-black text-sm flex-shrink-0 ${urgent ? "bg-red-50 text-red-600 animate-pulse" : "bg-slate-100 text-slate-700"}`}>
                            <span>{urgent ? "⏰" : "🕐"}</span>
                            <span>{fmtTime(timeLeft)}</span>
                        </div>
                    </div>
                </div>

                {/* Questions */}
                <div className="max-w-3xl mx-auto px-4 pt-8 space-y-6">
                    {questions.map((q, idx) => {
                        let opts: string[] = [];
                        try { opts = JSON.parse(q.options || "[]"); } catch { opts = []; }
                        const answered = answers[q.id] !== undefined;

                        return (
                            <div key={q.id} className={`bg-white rounded-3xl border-2 transition-all ${answered ? "border-violet-200" : "border-slate-100"} shadow-sm overflow-hidden`}>
                                {/* Question header */}
                                <div className="px-6 pt-5 pb-4">
                                    <div className="flex items-start gap-3 mb-3">
                                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 text-white mt-0.5 ${answered ? "bg-violet-500" : "bg-slate-300"}`}>
                                            {answered ? "✓" : idx + 1}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                    {q.type === "multiple_choice" ? "Бир туура жооп" : "Ачык суроо"}
                                                </span>
                                                <span className="text-[10px] font-bold text-violet-400">{q.points} упай</span>
                                            </div>
                                            <p className="text-slate-800 font-semibold text-sm leading-relaxed">{q.text}</p>
                                        </div>
                                    </div>

                                    {q.image_url && (
                                        <img src={q.image_url} alt="question" className="w-full max-h-64 object-contain rounded-xl mb-3 bg-slate-50" />
                                    )}
                                </div>

                                {/* Options or open */}
                                <div className="px-6 pb-5">
                                    {q.type === "multiple_choice" && opts.length > 0 ? (
                                        <div className="space-y-2">
                                            {opts.map((opt, oi) => {
                                                const letter = String.fromCharCode(65 + oi);
                                                const selected = answers[q.id] === opt;
                                                return (
                                                    <button key={oi} onClick={() => setAnswers(a => ({ ...a, [q.id]: opt }))}
                                                        className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border-2 text-left transition-all ${selected ? "border-violet-400 bg-violet-50" : "border-slate-100 hover:border-slate-200 hover:bg-slate-50"}`}>
                                                        <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0 transition-all ${selected ? "bg-violet-500 text-white" : "bg-slate-100 text-slate-500"}`}>
                                                            {selected ? "✓" : letter}
                                                        </div>
                                                        <span className={`text-sm font-semibold ${selected ? "text-violet-700" : "text-slate-700"}`}>{opt}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <textarea
                                            rows={3}
                                            placeholder="Жообуңузду жазыңыз..."
                                            value={answers[q.id] || ""}
                                            onChange={e => setAnswers(a => ({ ...a, [q.id]: e.target.value }))}
                                            className="w-full px-4 py-3 border-2 border-slate-200 rounded-2xl text-sm text-slate-700 focus:outline-none focus:border-violet-400 resize-none placeholder:text-slate-300 font-medium"
                                        />
                                    )}

                                    {q.hint && (
                                        <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                                            <span>💡</span> {q.hint}
                                        </p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Submit bar */}
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 shadow-lg">
                    <div className="max-w-3xl mx-auto flex items-center gap-4">
                        <div className="flex-1 text-sm text-slate-500 font-medium">
                            <span className="font-black text-slate-800">{answeredCount}</span> / {questions.length} жооп берилди
                        </div>
                        <button
                            onClick={() => handleSubmit(false)}
                            disabled={submitting}
                            className="px-8 py-3.5 rounded-2xl font-black text-white disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-[0.98]"
                            style={{ background:"linear-gradient(135deg,#7c3aed,#0ea5e9)" }}>
                            {submitting ? "Жиберилүүдө..." : "Тапшыруу ✓"}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return null;
}
