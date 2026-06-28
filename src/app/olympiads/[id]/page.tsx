"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Cookies from "js-cookie";
import { Icon } from "@iconify/react";
import { GO_API_URL } from "@/utils/apiData";

interface Olympiad {
    ID: number; title: string; description: string; subject: string; date: string;
    image_url: string; file_url: string; format: string; location: string;
    prize_1: string; prize_2: string; prize_3: string; status: string; time_limit: number;
}

function decodeToken(token: string): { user_id?: number; email?: string } | null {
    try { return JSON.parse(atob(token.split(".")[1])); } catch { return null; }
}
function getToken() { return Cookies.get("auth_token") || null; }
function saveToken(t: string) { Cookies.set("auth_token", t, { expires: 7, path: "/" }); }

const FACE_PHASES = [
    { key: "front", label: "Алдыга карата туруңуз",  dirIcon: null,    hint: "Жүзүңүздү тике кармаңыз" },
    { key: "left",  label: "Солго 45° буруңуз",       dirIcon: "left",  hint: "Башыңызды акырын солго буруңуз" },
    { key: "right", label: "Оңго 45° буруңуз",        dirIcon: "right", hint: "Башыңызды акырын оңго буруңуз" },
] as const;
type FaceKey = "front" | "left" | "right";

interface FaceQuality {
    score: number;        // 0–100
    facePresent: boolean;
    lightingOk: boolean;
    tooDark: boolean;
    tooBright: boolean;
    centered: boolean;
}

type ModalView = "auth" | "form" | "done";
type AuthTab   = "login" | "register";
type FormStep  = 1 | 2 | 3;

interface RegForm {
    fio: string; school: string; class_name: string;
    birth_date: string; phone: string; certificate_url: string;
}

export default function OlympiadDetailPage({ params }: { params: { id: string } }) {
    const [olympiad, setOlympiad] = useState<Olympiad | null>(null);
    const [loading, setLoading]   = useState(true);
    const [mounted, setMounted]   = useState(false);
    const [appStatus, setAppStatus] = useState<string | null>(null);
    const [userEmail, setUserEmail] = useState("");

    const [modalView, setModalView] = useState<ModalView | null>(null);

    // Auth
    const [authTab,      setAuthTab]      = useState<AuthTab>("register");
    const [authEmail,    setAuthEmail]    = useState("");
    const [authPassword, setAuthPassword] = useState("");
    const [authConfirm,  setAuthConfirm]  = useState("");
    const [authLoading,  setAuthLoading]  = useState(false);
    const [authError,    setAuthError]    = useState("");

    // Form
    const [formStep,    setFormStep]    = useState<FormStep>(1);
    const [form,        setForm]        = useState<RegForm>({ fio: "", school: "", class_name: "", birth_date: "", phone: "", certificate_url: "" });
    const [certFile,    setCertFile]    = useState<File | null>(null);
    const [certPreview, setCertPreview] = useState<string | null>(null);
    const [uploading,   setUploading]   = useState(false);
    const [formError,   setFormError]   = useState("");
    const [submitting,  setSubmitting]  = useState(false);
    const [facesUploading, setFacesUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Camera / face
    const videoRef    = useRef<HTMLVideoElement>(null);
    const canvasRef   = useRef<HTMLCanvasElement>(null);
    const streamRef   = useRef<MediaStream | null>(null);
    const offscreenRef = useRef<HTMLCanvasElement | null>(null);
    const rafRef      = useRef<number>(0);
    const stableRef   = useRef<number>(0);   // frames with good quality
    const countdownRunningRef = useRef(false);

    const [facePhaseIdx,   setFacePhaseIdx]   = useState(0);
    const [countdown,      setCountdown]      = useState(0);
    const [capturedFaces,  setCapturedFaces]  = useState<Partial<Record<FaceKey, string>>>({});
    const [cameraError,    setCameraError]    = useState("");
    const [faceQuality,    setFaceQuality]    = useState<FaceQuality | null>(null);
    const [autoCapturing,  setAutoCapturing]  = useState(false);   // "Камера издеп жатат..."

    useEffect(() => { setMounted(true); offscreenRef.current = document.createElement("canvas"); }, []);

    // Fetch olympiad
    useEffect(() => {
        fetch(`${GO_API_URL}/api/olympiads/${params.id}`)
            .then(r => r.ok ? r.json() : null)
            .then(d => { if (d) setOlympiad(d); })
            .finally(() => setLoading(false));
    }, [params.id]);

    // My application status
    useEffect(() => {
        const token = getToken();
        if (!token) return;
        const claims = decodeToken(token);
        if (claims?.email) setUserEmail(claims.email);
        fetch(`${GO_API_URL}/api/olympiads/${params.id}/my-application`, {
            headers: { Authorization: `Bearer ${token}` },
        }).then(r => r.ok ? r.json() : null)
          .then(d => { if (d?.status) setAppStatus(d.status); })
          .catch(() => {});
    }, [params.id]);

    // ── Camera ──────────────────────────────────────────────
    const startCamera = useCallback(async () => {
        setCameraError("");
        try {
            const s = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
            });
            streamRef.current = s;
            if (videoRef.current) { videoRef.current.srcObject = s; videoRef.current.play(); }
        } catch {
            setCameraError("Камерага уруксат жок. Браузердин жөндөөлөрүнөн уруксат бериңиз.");
        }
    }, []);

    const stopCamera = useCallback(() => {
        cancelAnimationFrame(rafRef.current);
        streamRef.current?.getTracks().forEach(t => t.stop());
        streamRef.current = null;
    }, []);

    // ── Face quality via pixel sampling ─────────────────────
    const analyzeFace = useCallback((): FaceQuality | null => {
        const video = videoRef.current;
        const offscreen = offscreenRef.current;
        if (!video || !offscreen || video.videoWidth === 0 || video.readyState < 2) return null;

        const W = 80, H = 60;
        offscreen.width = W; offscreen.height = H;
        const ctx = offscreen.getContext("2d", { willReadFrequently: true });
        if (!ctx) return null;

        // Mirror draw to match the CSS scale-x-[-1] on video
        ctx.save(); ctx.translate(W, 0); ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, W, H);
        ctx.restore();
        const { data } = ctx.getImageData(0, 0, W, H);

        const cx = W / 2, cy = H / 2;
        const rx = W * 0.30, ry = H * 0.42;

        let skin = 0, total = 0, brightness = 0;
        let topSkin = 0, topTotal = 0;   // upper 1/3 of oval (where face is centered)

        for (let y = 0; y < H; y++) {
            for (let x = 0; x < W; x++) {
                const nx = (x - cx) / rx, ny = (y - cy) / ry;
                if (nx * nx + ny * ny > 1) continue;

                const i = (y * W + x) * 4;
                const r = data[i], g = data[i + 1], b = data[i + 2];
                total++;
                brightness += (r + g + b) / 3;

                // Broad skin-tone detector (works for many skin tones)
                const isSkin =
                    r > 60 && g > 30 && b > 15 &&
                    r > b &&
                    Math.abs(r - g) > 8 &&
                    r / (b + 1) > 1.05;

                if (isSkin) skin++;
                if (ny < -0.1) { topTotal++; if (isSkin) topSkin++; }
            }
        }

        if (total === 0) return null;

        const skinRatio = skin / total;
        const avgBrightness = brightness / total;
        const topRatio = topTotal > 0 ? topSkin / topTotal : 0;

        // Centerdness: face pixels concentrated in the top-center of oval
        const centered = topRatio > 0.15;

        // Score: blend skin ratio + centered penalty
        let score = Math.round(Math.min(100, skinRatio * 250));
        if (!centered && skinRatio > 0.1) score = Math.round(score * 0.75);

        return {
            score,
            facePresent:  skinRatio > 0.10,
            lightingOk:   avgBrightness > 55 && avgBrightness < 225,
            tooDark:      avgBrightness <= 55,
            tooBright:    avgBrightness >= 225,
            centered,
        };
    }, []);

    // ── RAF analysis loop ───────────────────────────────────
    useEffect(() => {
        if (modalView !== "form" || formStep !== 3 || cameraError) return;

        let active = true;
        let frameCount = 0;

        const loop = () => {
            if (!active) return;
            frameCount++;

            // Analyze every 3rd frame
            if (frameCount % 3 === 0) {
                const q = analyzeFace();
                if (q) {
                    setFaceQuality(q);

                    // Auto-countdown when quality is high
                    if (q.score >= 60 && !countdownRunningRef.current) {
                        stableRef.current++;
                        if (stableRef.current >= 40) {   // ~1.3s at 30fps
                            stableRef.current = 0;
                            countdownRunningRef.current = true;
                            setAutoCapturing(true);
                            setCountdown(3);
                        }
                    } else if (q.score < 40) {
                        stableRef.current = 0;
                    }
                }
            }

            rafRef.current = requestAnimationFrame(loop);
        };

        rafRef.current = requestAnimationFrame(loop);
        return () => {
            active = false;
            cancelAnimationFrame(rafRef.current);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [modalView, formStep, cameraError, facePhaseIdx, analyzeFace]);

    // ── Countdown tick ──────────────────────────────────────
    useEffect(() => {
        if (countdown <= 0) return;
        if (countdown === 1) {
            const t = setTimeout(() => captureCurrentFace(), 600);
            return () => clearTimeout(t);
        }
        const t = setTimeout(() => setCountdown(c => c - 1), 1000);
        return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [countdown]);

    const captureCurrentFace = () => {
        const canvas = canvasRef.current, video = videoRef.current;
        if (!canvas || !video) return;
        canvas.width  = video.videoWidth  || 640;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext("2d");
        if (ctx) {
            // mirror to match display
            ctx.save(); ctx.translate(canvas.width, 0); ctx.scale(-1, 1);
            ctx.drawImage(video, 0, 0);
            ctx.restore();
        }
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        const phase   = FACE_PHASES[facePhaseIdx].key;
        setCapturedFaces(prev => ({ ...prev, [phase]: dataUrl }));
        setCountdown(0);
        setAutoCapturing(false);
        countdownRunningRef.current = false;
        stableRef.current = 0;
        setFaceQuality(null);
        if (facePhaseIdx < FACE_PHASES.length - 1) {
            setTimeout(() => setFacePhaseIdx(i => i + 1), 800);
        }
    };

    // Reset when phase changes (user moved to next angle)
    useEffect(() => {
        stableRef.current = 0;
        countdownRunningRef.current = false;
        setAutoCapturing(false);
        setCountdown(0);
        setFaceQuality(null);
    }, [facePhaseIdx]);

    // Camera lifecycle
    useEffect(() => {
        if (modalView === "form" && formStep === 3) {
            setFacePhaseIdx(0);
            setCapturedFaces({});
            setCountdown(0);
            startCamera();
        } else {
            stopCamera();
        }
        return () => { stopCamera(); };
    }, [modalView, formStep, startCamera, stopCamera]);

    // ── Helpers ─────────────────────────────────────────────
    const dataUrlToBlob = (dataUrl: string): Blob => {
        const [header, data] = dataUrl.split(",");
        const mime = header.match(/:(.*?);/)?.[1] || "image/jpeg";
        const binary = atob(data);
        const arr = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
        return new Blob([arr], { type: mime });
    };

    const uploadFacePhoto = async (dataUrl: string): Promise<string | null> => {
        const blob = dataUrlToBlob(dataUrl);
        const fd = new FormData();
        fd.append("file", blob, "face.jpg");
        const res = await fetch(`${GO_API_URL}/api/upload-certificate`, { method: "POST", body: fd });
        if (!res.ok) return null;
        return (await res.json()).url || null;
    };

    const allFacesCaptured = FACE_PHASES.every(p => capturedFaces[p.key]);

    // ── Auth ────────────────────────────────────────────────
    const handleAuth = async () => {
        setAuthError("");
        if (!authEmail.trim()) { setAuthError("Email киргизиңиз"); return; }
        if (!authPassword || authPassword.length < 6) { setAuthError("Пароль минимум 6 белги"); return; }
        if (authTab === "register" && authPassword !== authConfirm) { setAuthError("Паролдор дал келбейт"); return; }
        setAuthLoading(true);
        try {
            const url = authTab === "register" ? `${GO_API_URL}/api/quick-register` : `${GO_API_URL}/api/login`;
            const res  = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify({ email: authEmail.trim().toLowerCase(), password: authPassword }) });
            const data = await res.json();
            if (res.ok && data.token) { saveToken(data.token); setUserEmail(data.user?.email || authEmail); openForm(); }
            else setAuthError(data.error || "Ката кетти");
        } finally { setAuthLoading(false); }
    };

    const openForm = () => {
        setFormStep(1); setFormError(""); setCertFile(null); setCertPreview(null);
        setForm({ fio: "", school: "", class_name: "", birth_date: "", phone: "", certificate_url: "" });
        setModalView("form");
    };

    const handleOpen = () => {
        const token = getToken();
        if (token) { const c = decodeToken(token); if (c?.email) setUserEmail(c.email); openForm(); }
        else { setAuthEmail(""); setAuthPassword(""); setAuthConfirm(""); setAuthError(""); setAuthTab("register"); setModalView("auth"); }
    };

    const closeModal = () => { stopCamera(); setModalView(null); };

    const handleCertSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]; if (!file) return;
        setCertFile(file);
        if (file.type.startsWith("image/")) { const r = new FileReader(); r.onload = ev => setCertPreview(ev.target?.result as string); r.readAsDataURL(file); }
        else setCertPreview(null);
    };

    const goNextStep = async () => {
        setFormError("");
        if (formStep === 1) {
            if (!form.fio.trim())       { setFormError("ФИОну толтуруңуз"); return; }
            if (!form.school.trim())    { setFormError("Мектепти толтуруңуз"); return; }
            if (!form.class_name.trim()){ setFormError("Классты толтуруңуз"); return; }
            if (!form.birth_date)       { setFormError("Туулган күндү тандаңыз"); return; }
            setFormStep(2);
        } else if (formStep === 2) {
            if (certFile) {
                setUploading(true);
                const fd = new FormData(); fd.append("file", certFile);
                const res = await fetch(`${GO_API_URL}/api/upload-certificate`, { method: "POST", body: fd });
                setUploading(false);
                if (res.ok) { const d = await res.json(); setForm(prev => ({ ...prev, certificate_url: d.url || "" })); }
            }
            setFormStep(3);
        }
    };

    const handleSubmit = async () => {
        if (!allFacesCaptured) { setFormError("Үч тараптан сүрөт тартыңыз"); return; }
        setSubmitting(true); setFacesUploading(true);
        try {
            const faceUrls: Partial<Record<FaceKey, string>> = {};
            for (const phase of FACE_PHASES) {
                const dataUrl = capturedFaces[phase.key];
                if (dataUrl) { const url = await uploadFacePhoto(dataUrl); if (url) faceUrls[phase.key] = url; }
            }
            setFacesUploading(false);
            const token = getToken();
            const res = await fetch(`${GO_API_URL}/api/olympiads/${params.id}/apply`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ ...form, email: userEmail, face_embeddings: JSON.stringify(faceUrls) }),
            });
            const data = await res.json();
            if (res.ok) { stopCamera(); setModalView("done"); setAppStatus("pending"); }
            else setFormError(data.error || "Ката кетти");
        } finally { setSubmitting(false); setFacesUploading(false); }
    };

    // ── Score → color ───────────────────────────────────────
    const scoreColor = (s: number) =>
        s >= 75 ? "#22c55e" : s >= 50 ? "#84cc16" : s >= 30 ? "#f97316" : "#94a3b8";
    const scoreBg    = (s: number) =>
        s >= 75 ? "#dcfce7" : s >= 50 ? "#ecfccb" : s >= 30 ? "#ffedd5" : "#f1f5f9";
    const scoreLabel = (q: FaceQuality) => {
        if (q.tooDark)    return "Жарык жетишсиз — чырак жак";
        if (q.tooBright)  return "Өтө жарык — арка жакка ооңуз";
        if (!q.facePresent) return "Жүзүңүз табылган жок — жакыныраак туруңуз";
        if (!q.centered)   return "Башыңызды жогору же төмөн жылдырыңыз";
        if (q.score < 50)  return "Дагы жакшыраак болсо болот...";
        if (q.score < 75)  return "Жакшы! Туруңуз...";
        return "Аябай жакшы! Туруп туруңуз...";
    };

    // ── Render helpers ──────────────────────────────────────
    if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(145deg,#f0f4ff,#faf5ff)" }}><p className="text-slate-400 font-bold animate-pulse">Жүктөлүүдө...</p></div>;
    if (!olympiad) return <div className="min-h-screen flex items-center justify-center"><p className="text-2xl font-black text-slate-700">Олимпиада табылган жок</p></div>;

    const isOnline = olympiad.format === "Онлайн";
    const prizes = [
        { label: "1-Орун", emoji: "🥇", value: olympiad.prize_1, fallback: "Алтын медаль & Баалуу белек", bg: "from-yellow-50 to-amber-50", border: "border-yellow-300", text: "text-yellow-700" },
        { label: "2-Орун", emoji: "🥈", value: olympiad.prize_2, fallback: "Күмүш медаль & Диплом",       bg: "from-slate-50 to-gray-100",  border: "border-slate-300",  text: "text-slate-600"  },
        { label: "3-Орун", emoji: "🥉", value: olympiad.prize_3, fallback: "Коло медаль & Сертификат",   bg: "from-orange-50 to-amber-50", border: "border-orange-300", text: "text-orange-700" },
    ];

    const statusBanner = appStatus && (() => {
        const m = { pending: { bg: "bg-amber-50 border-amber-200 text-amber-700", icon: "solar:clock-circle-bold-duotone", msg: "Өтүнүчүңүз жиберилди. Администратор текшерет." }, approved: { bg: "bg-green-50 border-green-200 text-green-700", icon: "solar:check-circle-bold-duotone", msg: "Өтүнүчүңүз бекитилди!" }, rejected: { bg: "bg-red-50 border-red-200 text-red-700", icon: "solar:close-circle-bold-duotone", msg: "Өтүнүчүңүз четке кагылды." } }[appStatus];
        if (!m) return null;
        return <div className={`flex items-center gap-3 p-4 rounded-2xl border text-sm font-bold ${m.bg}`}>{mounted && <Icon icon={m.icon} width={22} className="flex-shrink-0" />}{m.msg}</div>;
    })();

    const StepBar = ({ current, total }: { current: number; total: number }) => (
        <div className="flex items-center gap-2 mb-5">
            {Array.from({ length: total }, (_, i) => i + 1).map(s => (
                <React.Fragment key={s}>
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-black transition-all ${current === s ? "text-white shadow-lg" : current > s ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400"}`}
                        style={current === s ? { background: "linear-gradient(135deg,#7c3aed,#0ea5e9)" } : {}}>
                        {current > s ? "✓" : s}
                    </div>
                    {s < total && <div className={`flex-1 h-0.5 rounded-full ${current > s ? "bg-emerald-400" : "bg-slate-200"}`} />}
                </React.Fragment>
            ))}
        </div>
    );

    return (
        <main className="min-h-screen pb-24" style={{ background: "linear-gradient(145deg,#f0f4ff 0%,#faf5ff 35%,#f0fdf4 65%,#fff7ed 100%)" }}>
            {/* decorative bg */}
            <div className="pointer-events-none fixed inset-0" style={{ backgroundImage: "radial-gradient(circle,rgba(99,102,241,0.1) 1px,transparent 1px)", backgroundSize: "36px 36px" }} />
            <div className="pointer-events-none fixed inset-0 overflow-hidden">
                <div style={{ position:"absolute", top:"-10%", right:"-5%", width:"500px", height:"500px", borderRadius:"50%", background:"radial-gradient(circle,rgba(167,139,250,0.25) 0%,transparent 70%)", filter:"blur(60px)" }} />
                <div style={{ position:"absolute", bottom:"10%", left:"-5%", width:"400px", height:"400px", borderRadius:"50%", background:"radial-gradient(circle,rgba(6,182,212,0.18) 0%,transparent 70%)", filter:"blur(60px)" }} />
            </div>

            <div className="relative z-10 pt-32 container mx-auto px-4">
                <a href="/olympiads" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-violet-600 transition-colors mb-8 group">
                    {mounted && <Icon icon="solar:arrow-left-bold-duotone" width={18} className="group-hover:-translate-x-1 transition-transform" />}
                    Олимпиадаларга кайтуу
                </a>

                {/* ── HERO ── */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start mb-14">
                    <div className="lg:col-span-5 relative aspect-video lg:aspect-square w-full rounded-[2.5rem] overflow-hidden shadow-2xl shadow-violet-200/50 border-4 border-white">
                        <Image src={olympiad.image_url || "/images/courses/placeholder.png"} alt={olympiad.title} fill className="object-cover" />
                        <div className="absolute inset-0" style={{ background:"linear-gradient(to bottom,transparent 50%,rgba(0,0,0,0.35) 100%)" }} />
                        <div className="absolute bottom-5 left-5 px-4 py-2 rounded-2xl backdrop-blur-md text-white text-xs font-black uppercase tracking-wider" style={{ background:"rgba(124,58,237,0.75)" }}>{olympiad.subject}</div>
                    </div>

                    <div className="lg:col-span-7 space-y-6">
                        <div className="flex flex-wrap gap-3">
                            <span className="px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5" style={{ background: isOnline?"rgba(139,92,246,0.1)":"rgba(14,165,233,0.1)", color: isOnline?"#7c3aed":"#0284c7", border:`1.5px solid ${isOnline?"rgba(139,92,246,0.3)":"rgba(14,165,233,0.3)"}` }}>
                                <span className="h-2 w-2 rounded-full animate-pulse" style={{ background: isOnline?"#8b5cf6":"#0ea5e9" }} />{olympiad.format}
                            </span>
                            {olympiad.status === "registration" && <span className="px-4 py-1.5 bg-blue-50 border border-blue-200 text-blue-600 rounded-full text-xs font-black uppercase tracking-wider animate-pulse">Катышуу ачык</span>}
                        </div>
                        <h1 className="text-3xl md:text-5xl font-black text-slate-900 leading-tight">{olympiad.title}</h1>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                                <div className="p-3 rounded-xl" style={{ background:"rgba(124,58,237,0.08)" }}>{mounted && <Icon icon="solar:calendar-date-bold-duotone" width={22} style={{ color:"#7c3aed" }} />}</div>
                                <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Өткөрүлүүчү күнү</p><p className="text-sm font-black text-slate-800">{olympiad.date}</p></div>
                            </div>
                            <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                                <div className="p-3 rounded-xl" style={{ background:"rgba(239,68,68,0.07)" }}>{mounted && <Icon icon="solar:map-point-bold-duotone" width={22} className="text-rose-500" />}</div>
                                <div className="min-w-0"><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Өтүүчү орду</p><p className="text-sm font-black text-slate-800 truncate">{olympiad.location || "Дареги такталууда"}</p></div>
                            </div>
                        </div>
                        {statusBanner}
                        <div className="flex flex-col sm:flex-row gap-4 pt-2">
                            {olympiad.status !== "registration" ? (
                                <div className="flex-1 px-8 py-4 bg-slate-100 text-slate-400 font-black rounded-2xl text-sm text-center cursor-not-allowed">
                                    {olympiad.status === "active" ? "Каттоо аяктады" : olympiad.status === "finished" ? "Олимпиада аяктады" : "Каттоо ачылган жок"}
                                </div>
                            ) : !appStatus ? (
                                <button onClick={handleOpen} className="flex-1 px-8 py-4 font-black rounded-2xl text-white text-sm shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]" style={{ background:"linear-gradient(135deg,#7c3aed,#0ea5e9)", boxShadow:"0 10px 30px rgba(124,58,237,0.3)" }}>
                                    Олимпиадага катышуу
                                </button>
                            ) : null}
                            {olympiad.file_url && (
                                <a href={olympiad.file_url} target="_blank" rel="noopener noreferrer" className="px-6 py-4 bg-white border-2 border-slate-200 text-slate-700 font-bold rounded-2xl hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 text-sm shadow-sm">
                                    {mounted && <Icon icon="solar:document-download-bold" className="text-emerald-500" width={20} />} Жобону алуу
                                </a>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── BOTTOM INFO ── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 border-t border-slate-200/60 pt-12">
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                            <h3 className="text-xl font-black text-slate-800 mb-4 flex items-center gap-2">{mounted && <Icon icon="solar:info-circle-bold-duotone" className="text-violet-500" width={22} />}Олимпиада тууралуу</h3>
                            <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">{olympiad.description || "Бул олимпиада боюнча толук маалымат жакында жарыяланат."}</p>
                        </div>
                        <div className="p-8 rounded-[2rem] border border-amber-200" style={{ background:"linear-gradient(135deg,#fffbeb,#fff7ed)" }}>
                            <h3 className="text-xl font-black text-amber-700 mb-6 flex items-center gap-2">{mounted && <Icon icon="solar:cup-bold-duotone" width={24} className="text-amber-500" />}Жеңүүчүлөргө сыйлыктар</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {prizes.map(p => (
                                    <div key={p.label} className={`bg-gradient-to-br ${p.bg} border ${p.border} p-5 rounded-2xl text-center`}>
                                        <div className="text-3xl mb-2">{p.emoji}</div>
                                        <h5 className={`font-black text-sm mt-1 ${p.text}`}>{p.label}</h5>
                                        <p className="text-xs text-slate-600 mt-1 leading-snug font-medium">{p.value || p.fallback}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm">
                        <h4 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">{mounted && <Icon icon="solar:shield-check-bold-duotone" className="text-violet-500" width={22} />}Негизги эрежелер</h4>
                        <div className="space-y-3">
                            {["Олимпиада башталган убакыттан кечигүүнү мүмкүн эмес.", "Катышуучу калем жана блокнот ала келиши керек.", "Жыйынтыктар 3 жумушчу күндүн ичинде жарыяланат."].map((rule, i) => (
                                <div key={i} className="flex items-start gap-3 bg-slate-50 p-4 rounded-2xl">
                                    <div className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-black text-white mt-0.5" style={{ background:"linear-gradient(135deg,#7c3aed,#0ea5e9)" }}>{i + 1}</div>
                                    <p className="text-xs font-semibold text-slate-600">{rule}</p>
                                </div>
                            ))}
                        </div>
                        <div className="mt-6 p-5 rounded-2xl text-white text-center" style={{ background:"linear-gradient(135deg,#7c3aed,#0ea5e9)", boxShadow:"0 8px 24px rgba(124,58,237,0.25)" }}>
                            <p className="text-xs font-bold leading-snug">Ар бир катышуучуга QR-коддуу санариптик Сертификат ыйгарылат</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ══════════════ MODAL ══════════════ */}
            {modalView && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className={`bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl w-full ${formStep === 3 && modalView === "form" ? "max-w-lg" : "max-w-lg"} max-h-[95vh] overflow-y-auto`}>

                        {/* Header */}
                        <div className="p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white rounded-t-[2.5rem] z-10">
                            <div>
                                <h2 className="text-lg font-black text-slate-800">
                                    {modalView === "auth" && (authTab === "register" ? "Каттоо" : "Кирүү")}
                                    {modalView === "form" && formStep === 1 && "Жеке маалымат"}
                                    {modalView === "form" && formStep === 2 && "Мектеп справкасы"}
                                    {modalView === "form" && formStep === 3 && "Жүз верификациясы"}
                                    {modalView === "done" && "Өтүнүч жиберилди"}
                                </h2>
                                {modalView === "form" && <p className="text-xs text-violet-600 font-bold truncate max-w-xs">{userEmail}</p>}
                            </div>
                            <button onClick={closeModal} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold transition-colors flex-shrink-0">✕</button>
                        </div>

                        <div className="p-5">

                            {/* ── AUTH ── */}
                            {modalView === "auth" && (
                                <div>
                                    <div className="flex bg-slate-100 rounded-2xl p-1 mb-5">
                                        {(["register","login"] as AuthTab[]).map(tab => (
                                            <button key={tab} onClick={() => { setAuthTab(tab); setAuthError(""); }}
                                                className={`flex-1 py-2.5 rounded-xl text-sm font-black transition-all ${authTab === tab ? "bg-white shadow text-violet-600" : "text-slate-500 hover:text-slate-700"}`}>
                                                {tab === "register" ? "Катталуу" : "Кирүү"}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="space-y-3">
                                        <div><label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5">Email</label>
                                            <input type="email" autoFocus className="w-full px-4 py-3 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-400 placeholder:text-slate-300" placeholder="email@example.com" value={authEmail} onChange={e => { setAuthEmail(e.target.value); setAuthError(""); }} /></div>
                                        <div><label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5">Пароль</label>
                                            <input type="password" className="w-full px-4 py-3 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-400 placeholder:text-slate-300" placeholder="Минимум 6 белги" value={authPassword} onChange={e => { setAuthPassword(e.target.value); setAuthError(""); }} /></div>
                                        {authTab === "register" && (
                                            <div><label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5">Паролду кайталаңыз</label>
                                                <input type="password" className="w-full px-4 py-3 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-400 placeholder:text-slate-300" placeholder="Жогорудагы пароль" value={authConfirm} onChange={e => { setAuthConfirm(e.target.value); setAuthError(""); }} onKeyDown={e => e.key === "Enter" && handleAuth()} /></div>
                                        )}
                                        {authError && <p className="text-sm text-red-500 font-bold bg-red-50 p-3 rounded-xl">{authError}</p>}
                                        <button onClick={handleAuth} disabled={authLoading} className="w-full py-4 rounded-2xl font-black text-white mt-1 disabled:opacity-60" style={{ background:"linear-gradient(135deg,#7c3aed,#0ea5e9)" }}>
                                            {authLoading ? "Жүктөлүүдө..." : authTab === "register" ? "Катталуу жана уланткыла →" : "Кирүү жана уланткыла →"}
                                        </button>
                                        {authTab === "register" ? (
                                            <p className="text-center text-xs text-slate-400 pt-1">Мурда аккаунт ачкансызбы?{" "}<button onClick={() => { setAuthTab("login"); setAuthError(""); }} className="text-violet-600 font-bold hover:underline">Кирүү</button></p>
                                        ) : (
                                            <p className="text-center text-xs text-slate-400 pt-1">Аккаунтуңуз жок беле?{" "}<button onClick={() => { setAuthTab("register"); setAuthError(""); }} className="text-violet-600 font-bold hover:underline">Катталуу</button></p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* ── FORM ── */}
                            {modalView === "form" && (
                                <div>
                                    <StepBar current={formStep} total={3} />

                                    {/* STEP 1 */}
                                    {formStep === 1 && (
                                        <div className="space-y-4">
                                            {[{ f:"fio", l:"Толук ФИО *", p:"Дүйшөматов Бекзат Серикович" }, { f:"school", l:"Мектеп *", p:"№65 орто мектеп, Бишкек" }, { f:"class_name", l:"Класс *", p:"10-А" }, { f:"phone", l:"Телефон", p:"+996 700 123 456" }].map(({ f, l, p }) => (
                                                <div key={f}><label className="block text-xs font-bold text-slate-500 mb-1.5">{l}</label>
                                                    <input type="text" className="w-full px-4 py-3 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-400 placeholder:text-slate-300" placeholder={p} value={form[f as keyof RegForm]} onChange={e => { setForm(prev => ({ ...prev, [f]: e.target.value })); setFormError(""); }} /></div>
                                            ))}
                                            <div><label className="block text-xs font-bold text-slate-500 mb-1.5">Туулган күн *</label>
                                                <input type="date" className="w-full px-4 py-3 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-400" value={form.birth_date} max={new Date().toISOString().split("T")[0]} onChange={e => { setForm(prev => ({ ...prev, birth_date: e.target.value })); setFormError(""); }} /></div>
                                            {formError && <p className="text-sm text-red-500 font-bold bg-red-50 p-3 rounded-xl">{formError}</p>}
                                            <button onClick={goNextStep} className="w-full py-4 rounded-2xl font-black text-white" style={{ background:"linear-gradient(135deg,#7c3aed,#0ea5e9)" }}>Кийинки →</button>
                                        </div>
                                    )}

                                    {/* STEP 2 */}
                                    {formStep === 2 && (
                                        <div className="space-y-4">
                                            <div>
                                                <p className="text-xs font-black text-slate-500 uppercase tracking-wider mb-1">Мектеп справкасы</p>
                                                <p className="text-xs text-slate-400 mb-3">Мектептин мөөрү жана директордун колтамгасы болушу керек (фото же PDF)</p>
                                            </div>
                                            <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center cursor-pointer hover:border-violet-400 hover:bg-violet-50/30 transition-all">
                                                {certPreview ? <img src={certPreview} alt="cert" className="max-h-48 mx-auto rounded-xl object-contain" />
                                                    : certFile ? <><p className="text-4xl mb-2">📄</p><p className="text-sm font-bold text-slate-600">{certFile.name}</p></>
                                                    : <><p className="text-4xl mb-3">📎</p><p className="text-sm font-bold text-slate-600">Документти жүктөө</p><p className="text-xs text-slate-400 mt-1">PNG, JPG же PDF • макс. 10 MB</p></>}
                                                <input ref={fileInputRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleCertSelect} />
                                            </div>
                                            {certFile && <button onClick={() => { setCertFile(null); setCertPreview(null); }} className="text-xs text-red-500 font-bold hover:underline">✕ Файлды жок кылуу</button>}
                                            {formError && <p className="text-sm text-red-500 font-bold bg-red-50 p-3 rounded-xl">{formError}</p>}
                                            <div className="flex gap-3">
                                                <button onClick={() => setFormStep(1)} className="px-5 py-3 bg-slate-100 rounded-2xl font-bold text-sm text-slate-600 hover:bg-slate-200 transition-colors">← Артка</button>
                                                <button onClick={goNextStep} disabled={uploading} className="flex-1 py-3 rounded-2xl font-black text-white disabled:opacity-60" style={{ background:"linear-gradient(135deg,#7c3aed,#0ea5e9)" }}>{uploading ? "Жүктөлүүдө..." : "Кийинки →"}</button>
                                            </div>
                                        </div>
                                    )}

                                    {/* ── STEP 3: FACE CAPTURE ── */}
                                    {formStep === 3 && (
                                        <div className="space-y-3">

                                            {/* Phase progress dots */}
                                            <div className="flex gap-2 mb-1">
                                                {FACE_PHASES.map((p, i) => (
                                                    <div key={p.key} className={`flex-1 py-2 rounded-xl text-xs font-black text-center transition-all border ${capturedFaces[p.key] ? "bg-emerald-50 border-emerald-300 text-emerald-600" : i === facePhaseIdx ? "border-violet-300 text-violet-700" : "bg-slate-50 border-slate-200 text-slate-400"}`}
                                                        style={i === facePhaseIdx && !capturedFaces[p.key] ? { background:"rgba(124,58,237,0.06)" } : {}}>
                                                        {capturedFaces[p.key] ? "✓ " : ""}{p.key === "front" ? "Алды" : p.key === "left" ? "Сол" : "Оң"}
                                                    </div>
                                                ))}
                                            </div>

                                            {cameraError ? (
                                                <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
                                                    <p className="text-4xl mb-3">📷</p>
                                                    <p className="text-sm font-bold text-red-600">{cameraError}</p>
                                                    <button onClick={startCamera} className="mt-4 px-5 py-2 bg-red-500 text-white rounded-xl font-bold text-sm">Кайра аракет</button>
                                                </div>
                                            ) : (
                                                <>
                                                    {/* Camera viewport */}
                                                    <div className="relative rounded-2xl overflow-hidden bg-slate-900 select-none" style={{ aspectRatio:"4/3" }}>
                                                        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
                                                        <canvas ref={canvasRef} className="hidden" />

                                                        {/* Oval guide */}
                                                        {(() => {
                                                            const s = faceQuality?.score ?? 0;
                                                            const color = scoreColor(s);
                                                            const glow  = s >= 75 ? `0 0 0 2000px rgba(0,0,0,0.4), 0 0 20px 4px ${color}40` : "0 0 0 2000px rgba(0,0,0,0.45)";
                                                            return (
                                                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                                    <div className="rounded-full transition-all duration-300"
                                                                        style={{ width:"56%", height:"78%", border:`3px solid ${color}`, boxShadow: glow, opacity: faceQuality ? 1 : 0.5 }}>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })()}

                                                        {/* Direction arrow overlay */}
                                                        {FACE_PHASES[facePhaseIdx]?.dirIcon && !capturedFaces[FACE_PHASES[facePhaseIdx].key] && countdown === 0 && (
                                                            <div className="absolute inset-0 flex items-center pointer-events-none"
                                                                style={{ justifyContent: FACE_PHASES[facePhaseIdx].dirIcon === "left" ? "flex-end" : "flex-start" }}>
                                                                <div className="flex flex-col gap-1 px-3 py-4 opacity-80">
                                                                    {[0,1,2].map(i => (
                                                                        <div key={i} className="text-white font-black text-xl" style={{
                                                                            animationName: "arrowPulse",
                                                                            animationDuration: "0.8s",
                                                                            animationDelay: `${i * 0.15}s`,
                                                                            animationIterationCount: "infinite",
                                                                            animationTimingFunction: "ease-in-out",
                                                                            opacity: 0,
                                                                        }}>
                                                                            {FACE_PHASES[facePhaseIdx].dirIcon === "left" ? "◀" : "▶"}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Countdown overlay */}
                                                        {countdown > 0 && (
                                                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                                <div className="flex flex-col items-center gap-2">
                                                                    {autoCapturing && <p className="text-white text-xs font-bold bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm">Жүзүңүздү кармап туруңуз</p>}
                                                                    <span className="font-black text-white drop-shadow-2xl" style={{ fontSize:"5rem", lineHeight:1, textShadow:"0 0 20px rgba(0,0,0,0.8)" }}>{countdown}</span>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Flash after capture */}
                                                        {countdown === 0 && capturedFaces[FACE_PHASES[facePhaseIdx]?.key] && (
                                                            <div className="absolute inset-0 flex items-center justify-center bg-white/20 pointer-events-none">
                                                                <div className="text-5xl">✅</div>
                                                            </div>
                                                        )}

                                                        {/* Top instruction bar */}
                                                        <div className="absolute top-3 left-0 right-0 flex justify-center pointer-events-none">
                                                            <div className="bg-black/50 backdrop-blur-sm text-white text-xs font-bold px-4 py-2 rounded-full">
                                                                {capturedFaces[FACE_PHASES[facePhaseIdx]?.key]
                                                                    ? "✓ Сүрөт тартылды!"
                                                                    : FACE_PHASES[facePhaseIdx]?.label}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Quality panel */}
                                                    {faceQuality && !capturedFaces[FACE_PHASES[facePhaseIdx]?.key] && (
                                                        <div className="rounded-2xl p-4 space-y-2.5 border transition-all" style={{ background: scoreBg(faceQuality.score), borderColor: scoreColor(faceQuality.score) + "80" }}>
                                                            {/* Score bar */}
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-xs font-black text-slate-500 w-16 flex-shrink-0">Сапаты</span>
                                                                <div className="flex-1 bg-slate-200 rounded-full h-2.5 overflow-hidden">
                                                                    <div className="h-full rounded-full transition-all duration-300" style={{ width:`${faceQuality.score}%`, background: scoreColor(faceQuality.score) }} />
                                                                </div>
                                                                <span className="text-xs font-black w-8 text-right" style={{ color: scoreColor(faceQuality.score) }}>{faceQuality.score}%</span>
                                                            </div>

                                                            {/* Status message */}
                                                            <p className="text-xs font-bold text-center" style={{ color: scoreColor(faceQuality.score) }}>{scoreLabel(faceQuality)}</p>

                                                            {/* Checklist */}
                                                            <div className="grid grid-cols-3 gap-1.5 pt-1">
                                                                {[
                                                                    { ok: faceQuality.facePresent, label: "Жүз табылды" },
                                                                    { ok: faceQuality.lightingOk,  label: "Жарык жакшы" },
                                                                    { ok: faceQuality.centered,    label: "Туура бурч" },
                                                                ].map(({ ok, label }) => (
                                                                    <div key={label} className={`flex items-center gap-1 px-2 py-1.5 rounded-xl text-[10px] font-bold ${ok ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"}`}>
                                                                        <span>{ok ? "✓" : "○"}</span><span>{label}</span>
                                                                    </div>
                                                                ))}
                                                            </div>

                                                            {/* Auto hint */}
                                                            {faceQuality.score >= 60 && countdown === 0 && (
                                                                <p className="text-[10px] text-center font-bold text-violet-600 animate-pulse">
                                                                    Автоматтык тартылат — туруп туруңуз...
                                                                </p>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Hint card when no face yet */}
                                                    {!faceQuality && !capturedFaces[FACE_PHASES[facePhaseIdx]?.key] && (
                                                        <div className="bg-violet-50 border border-violet-200 rounded-2xl p-3 text-center">
                                                            <p className="text-xs font-bold text-violet-600">{FACE_PHASES[facePhaseIdx]?.hint}</p>
                                                        </div>
                                                    )}
                                                </>
                                            )}

                                            {/* Captured previews */}
                                            <div className="flex gap-2">
                                                {FACE_PHASES.map((p, i) => (
                                                    <div key={p.key} className={`flex-1 rounded-xl overflow-hidden border-2 transition-all ${capturedFaces[p.key] ? "border-emerald-400" : i === facePhaseIdx ? "border-violet-300" : "border-slate-200"}`} style={{ aspectRatio:"4/3" }}>
                                                        {capturedFaces[p.key]
                                                            ? <img src={capturedFaces[p.key]} alt={p.key} className="w-full h-full object-cover" />
                                                            : <div className={`w-full h-full flex flex-col items-center justify-center gap-1 ${i === facePhaseIdx ? "bg-violet-50" : "bg-slate-50"}`}>
                                                                <span className="text-lg">{i === facePhaseIdx ? "📷" : "⬜"}</span>
                                                                <span className="text-[9px] font-bold text-slate-400">{p.key === "front" ? "Алды" : p.key === "left" ? "Сол" : "Оң"}</span>
                                                              </div>}
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Manual capture button */}
                                            {!allFacesCaptured && !cameraError && countdown === 0 && !capturedFaces[FACE_PHASES[facePhaseIdx]?.key] && (
                                                <div className="flex gap-2">
                                                    <button onClick={() => { stableRef.current = 0; countdownRunningRef.current = true; setCountdown(3); }}
                                                        className="flex-1 py-3 rounded-2xl font-black text-white"
                                                        style={{ background:"linear-gradient(135deg,#7c3aed,#0ea5e9)" }}>
                                                        📸 Кол менен тартуу
                                                    </button>
                                                    {Object.keys(capturedFaces).length > 0 && (
                                                        <button onClick={() => { setCapturedFaces({}); setFacePhaseIdx(0); setCountdown(0); stableRef.current = 0; countdownRunningRef.current = false; setAutoCapturing(false); }}
                                                            className="px-4 py-3 bg-slate-100 rounded-2xl font-bold text-sm text-slate-600 hover:bg-slate-200 transition-colors">
                                                            Баштан
                                                        </button>
                                                    )}
                                                </div>
                                            )}

                                            {formError && <p className="text-sm text-red-500 font-bold bg-red-50 p-3 rounded-xl">{formError}</p>}

                                            <div className="flex gap-3">
                                                <button onClick={() => { stopCamera(); setFormStep(2); }} className="px-5 py-3 bg-slate-100 rounded-2xl font-bold text-sm text-slate-600 hover:bg-slate-200 transition-colors">← Артка</button>
                                                <button onClick={handleSubmit} disabled={submitting || !allFacesCaptured}
                                                    className="flex-1 py-3 rounded-2xl font-black text-white disabled:opacity-40 transition-all"
                                                    style={{ background:"linear-gradient(135deg,#7c3aed,#0ea5e9)" }}>
                                                    {submitting ? (facesUploading ? "Жүктөлүүдө..." : "Жиберилүүдө...") : "Жиберүү ✓"}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ── DONE ── */}
                            {modalView === "done" && (
                                <div className="text-center py-8">
                                    <div className="text-6xl mb-4">🎉</div>
                                    <h3 className="text-xl font-black text-slate-800 mb-2">Өтүнүч жиберилди!</h3>
                                    <p className="text-sm text-slate-500 leading-relaxed mb-6">Администратор маалыматтарыңызды жана жүз фотолоруңузду текшерет. Жооп <span className="font-bold text-slate-700">{userEmail}</span> дарегине жиберилет.</p>
                                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-left mb-6">
                                        <p className="text-xs font-black text-amber-600 uppercase tracking-wider mb-2">Кийинки кадамдар:</p>
                                        <ul className="text-sm text-amber-700 font-semibold space-y-1.5">
                                            <li className="flex gap-2"><span>1.</span> Администратор маалыматтарыңызды текшерет</li>
                                            <li className="flex gap-2"><span>2.</span> Мектеп справкаңыз жана жүз фотолоруңуз каралат</li>
                                            <li className="flex gap-2"><span>3.</span> Бекитүү тууралуу кабарланасыз</li>
                                        </ul>
                                    </div>
                                    <button onClick={closeModal} className="w-full py-4 rounded-2xl font-black text-white" style={{ background:"linear-gradient(135deg,#7c3aed,#0ea5e9)" }}>Жабуу</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Arrow animation keyframes */}
            <style>{`
                @keyframes arrowPulse {
                    0%   { opacity: 0;   transform: scale(0.7); }
                    50%  { opacity: 1;   transform: scale(1.1); }
                    100% { opacity: 0;   transform: scale(0.7); }
                }
            `}</style>
        </main>
    );
}
