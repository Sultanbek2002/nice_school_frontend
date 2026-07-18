"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Cookies from "js-cookie";
import { Icon } from "@iconify/react";
import { GO_API_URL } from "@/utils/apiData";
import { RelatedOlympiadCard, RelatedSectionBlock } from "@/app/components/RelatedSection";

interface Olympiad {
    ID: number; title: string; description: string; subject: string; date: string;
    start_time: string | null;
    image_url: string; file_url: string; format: string; location: string;
    prize_1: string; prize_2: string; prize_3: string; status: string; time_limit: number;
}

function fmtDateTime(iso: string | null | undefined): string {
    if (!iso) return "";
    try {
        const d = new Date(iso);
        if (isNaN(d.getTime())) return "";
        const pad = (n: number) => String(n).padStart(2, "0");
        return `${d.getDate()}-${pad(d.getMonth() + 1)}-${d.getFullYear()}  ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch { return ""; }
}

function decodeToken(token: string): { user_id?: number; email?: string } | null {
    try { return JSON.parse(atob(token.split(".")[1])); } catch { return null; }
}
function getToken() { return Cookies.get("auth_token") || null; }
function saveToken(t: string) { Cookies.set("auth_token", t, { expires: 7, path: "/" }); }

const FACE_PHASES = [
    { key: "front", label: "Смотрите прямо", dirIcon: null,   hint: "Держите лицо прямо", yawMin: -0.12, yawMax: 0.12 },
    { key: "left",  label: "Поверните влево 45°",     dirIcon: "left",  hint: "Медленно поверните голову влево", yawMin: -0.55, yawMax: -0.22 },
    { key: "right", label: "Поверните вправо 45°",      dirIcon: "right", hint: "Медленно поверните голову вправо", yawMin: 0.22,  yawMax: 0.55 },
] as const;
type FaceKey = "front" | "left" | "right";

// MediaPipe yaw: nose deviation from eye midpoint, normalized by eye width
// positive = face turned right (raw video), negative = face turned left (raw video)
interface PoseResult {
    faceDetected: boolean;
    yaw: number;          // -1..+1, 0 = straight
    lightingOk: boolean;
    brightness: number;
    angleOk: boolean;     // matches current phase requirement
}

type ModalView = "auth" | "form" | "done";
type AuthTab   = "login" | "register";
type FormStep  = 1 | 2 | 3;

interface RegForm {
    fio: string; school: string; class_name: string;
    birth_date: string; phone: string; certificate_url: string;
}

export default function OlympiadDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = React.use(params);
    const [olympiad, setOlympiad] = useState<Olympiad | null>(null);
    const [loading, setLoading]   = useState(true);
    const [mounted, setMounted]   = useState(false);
    const [appStatus, setAppStatus] = useState<string | null>(null);
    const [userEmail, setUserEmail] = useState("");

    // Results / leaderboard
    type ResultRow = { rank: number; fio: string; school: string; class_name: string; score: number; max_score: number; percentage: number; time_taken: number };
    const [results, setResults] = useState<ResultRow[]>([]);
    const [resultsLoading, setResultsLoading] = useState(false);
    const [otherOlympiads, setOtherOlympiads] = useState<Olympiad[]>([]);

    const [modalView, setModalView] = useState<ModalView | null>(null);

    // Auth
    const [authTab,         setAuthTab]         = useState<AuthTab>("register");
    const [authStep,        setAuthStep]        = useState<"credentials" | "otp">("credentials");
    const [authEmail,       setAuthEmail]       = useState("");
    const [authPassword,    setAuthPassword]    = useState("");
    const [authConfirm,     setAuthConfirm]     = useState("");
    const [authLoading,     setAuthLoading]     = useState(false);
    const [authError,       setAuthError]       = useState("");
    const [otpCode,         setOtpCode]         = useState("");
    const [pendingPassword, setPendingPassword] = useState("");

    // Form
    const [formStep,    setFormStep]    = useState<FormStep>(1);
    const [form,        setForm]        = useState<RegForm>({ fio: "", school: "", class_name: "", birth_date: "", phone: "", certificate_url: "" });
    const [certFile,    setCertFile]    = useState<File | null>(null);
    const [certPreview, setCertPreview] = useState<string | null>(null);
    const [uploading,   setUploading]   = useState(false);
    const [formError,   setFormError]   = useState("");
    const [submitting,  setSubmitting]  = useState(false);
    const [facesUploading, setFacesUploading] = useState(false);
    const [hasExistingProfile, setHasExistingProfile] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Camera / face
    const videoRef       = useRef<HTMLVideoElement>(null);
    const canvasRef      = useRef<HTMLCanvasElement>(null);
    const offscreenRef   = useRef<HTMLCanvasElement | null>(null);
    const streamRef      = useRef<MediaStream | null>(null);
    const rafRef         = useRef<number>(0);
    const landmarkerRef  = useRef<import("@mediapipe/tasks-vision").FaceLandmarker | null>(null);
    const stableRef      = useRef<number>(0);
    const countdownRunningRef = useRef(false);

    const [facePhaseIdx,   setFacePhaseIdx]   = useState(0);
    const [countdown,      setCountdown]      = useState(0);
    const [capturedFaces,  setCapturedFaces]  = useState<Partial<Record<FaceKey, string>>>({});
    const [cameraError,    setCameraError]    = useState("");
    const [poseResult,     setPoseResult]     = useState<PoseResult | null>(null);
    const [mpReady,        setMpReady]        = useState(false);
    const [mpLoading,      setMpLoading]      = useState(false);
    const [autoCapturing,  setAutoCapturing]  = useState(false);
    const [camPermission,  setCamPermission]  = useState<"prompt" | "requesting" | "granted" | "denied">("prompt");

    useEffect(() => {
        setMounted(true);
        offscreenRef.current = document.createElement("canvas");
    }, []);

    useEffect(() => {
        Promise.all([
            fetch(`${GO_API_URL}/api/olympiads/${id}`).then(r => r.ok ? r.json() : null),
            fetch(`${GO_API_URL}/api/olympiads`).then(r => r.ok ? r.json() : []),
        ]).then(([d, all]) => {
            if (d) {
                setOlympiad(d);
                if (d.status === "finished") {
                    setResultsLoading(true);
                    fetch(`${GO_API_URL}/api/olympiads/${id}/results`)
                        .then(r => r.ok ? r.json() : null)
                        .then(res => { if (res?.results) setResults(res.results); })
                        .finally(() => setResultsLoading(false));
                }
            }
            if (Array.isArray(all)) {
                setOtherOlympiads(all.filter((o: Olympiad) => o.ID !== Number(id)).slice(0, 4));
            }
        }).finally(() => setLoading(false));
    }, [id]);

    useEffect(() => {
        const token = getToken();
        if (!token) return;
        const claims = decodeToken(token);
        if (claims?.email) setUserEmail(claims.email);
        fetch(`${GO_API_URL}/api/olympiads/${id}/my-application`, {
            headers: { Authorization: `Bearer ${token}` },
        }).then(r => r.ok ? r.json() : null)
          .then(d => { if (d?.status) setAppStatus(d.status); })
          .catch(() => {});
    }, [id]);

    // ── Load MediaPipe FaceLandmarker ──────────────────────
    const loadMediaPipe = useCallback(async () => {
        if (landmarkerRef.current || mpLoading) return;
        setMpLoading(true);
        try {
            const { FaceLandmarker, FilesetResolver } = await import("@mediapipe/tasks-vision");
            const vision = await FilesetResolver.forVisionTasks(
                "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
            );
            landmarkerRef.current = await FaceLandmarker.createFromOptions(vision, {
                baseOptions: {
                    modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
                    delegate: "GPU",
                },
                runningMode: "VIDEO",
                numFaces: 1,
            });
            setMpReady(true);
        } catch (e) {
            console.error("MediaPipe load failed", e);
            setCameraError("Ошибка загрузки MediaPipe. Проверьте подключение к интернету.");
        } finally {
            setMpLoading(false);
        }
    }, [mpLoading]);

    // ── Camera ──────────────────────────────────────────────
    const startCamera = useCallback(async () => {
        setCameraError("");
        try {
            const s = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
            });
            streamRef.current = s;
            const video = videoRef.current;
            if (video) {
                video.srcObject = s;
                // wait for metadata before playing to avoid interrupted-play error
                await new Promise<void>(resolve => {
                    if (video.readyState >= 1) { resolve(); return; }
                    video.onloadedmetadata = () => resolve();
                });
                await video.play().catch(() => {});
            }
        } catch {
            setCameraError("Нет доступа к камере. Разрешите в настройках браузера.");
        }
    }, []);

    const stopCamera = useCallback(() => {
        cancelAnimationFrame(rafRef.current);
        streamRef.current?.getTracks().forEach(t => t.stop());
        streamRef.current = null;
    }, []);

    // ── Brightness via offscreen canvas ─────────────────────
    const getBrightness = useCallback((): number => {
        const video = videoRef.current;
        const canvas = offscreenRef.current;
        if (!video || !canvas || video.videoWidth === 0 || video.readyState < 2) return 128;
        const W = 40, H = 30;
        canvas.width = W; canvas.height = H;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return 128;
        ctx.drawImage(video, 0, 0, W, H);
        const { data } = ctx.getImageData(0, 0, W, H);
        let sum = 0;
        for (let i = 0; i < data.length; i += 4) sum += (data[i] + data[i+1] + data[i+2]) / 3;
        return sum / (W * H);
    }, []);

    // ── Detection RAF loop ──────────────────────────────────
    useEffect(() => {
        if (modalView !== "form" || formStep !== 3 || !mpReady || cameraError) return;

        let active = true;
        let lastTs = -1;

        const loop = (ts: number) => {
            if (!active) return;
            const video = videoRef.current;
            const lm = landmarkerRef.current;

            if (video && lm && video.readyState >= 3 && video.videoWidth > 0 && !video.paused && ts !== lastTs) {
                lastTs = ts;
                try {
                    const results = lm.detectForVideo(video, ts);
                    const brightness = getBrightness();
                    const lightingOk = brightness > 50 && brightness < 230;

                    if (results.faceLandmarks && results.faceLandmarks.length > 0) {
                        const pts = results.faceLandmarks[0];
                        // Landmarks: left eye outer = 33, right eye outer = 263, nose tip = 4
                        const leftEye  = pts[33];
                        const rightEye = pts[263];
                        const noseTip  = pts[4];

                        const midX     = (leftEye.x + rightEye.x) / 2;
                        const eyeWidth = Math.abs(rightEye.x - leftEye.x);
                        // Normalize: positive = nose right of midpoint (face turned right in raw)
                        const yaw = eyeWidth > 0.01 ? (noseTip.x - midX) / eyeWidth : 0;

                        const phase = FACE_PHASES[facePhaseIdx];
                        const angleOk = yaw >= phase.yawMin && yaw <= phase.yawMax;

                        const pose: PoseResult = { faceDetected: true, yaw, lightingOk, brightness, angleOk };
                        setPoseResult(pose);

                        // Auto-countdown when angle is correct + lighting ok
                        if (angleOk && lightingOk && !countdownRunningRef.current) {
                            stableRef.current++;
                            if (stableRef.current >= 45) {  // ~1.5s at 30fps
                                stableRef.current = 0;
                                countdownRunningRef.current = true;
                                setAutoCapturing(true);
                                setCountdown(3);
                            }
                        } else if (!angleOk) {
                            stableRef.current = 0;
                        }
                    } else {
                        setPoseResult({ faceDetected: false, yaw: 0, lightingOk, brightness, angleOk: false });
                        stableRef.current = 0;
                    }
                } catch { /* video not ready yet */ }
            }

            rafRef.current = requestAnimationFrame(loop);
        };

        rafRef.current = requestAnimationFrame(loop);
        return () => {
            active = false;
            cancelAnimationFrame(rafRef.current);
        };
    }, [modalView, formStep, mpReady, cameraError, facePhaseIdx, getBrightness]);

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
        setPoseResult(null);
        if (facePhaseIdx < FACE_PHASES.length - 1) {
            setTimeout(() => setFacePhaseIdx(i => i + 1), 800);
        }
    };

    useEffect(() => {
        stableRef.current = 0;
        countdownRunningRef.current = false;
        setAutoCapturing(false);
        setCountdown(0);
        setPoseResult(null);
    }, [facePhaseIdx]);

    // Attach stream to video element after permission granted (stream is in ref, video renders after state change)
    useEffect(() => {
        if (camPermission !== "granted" || !streamRef.current) return;
        const video = videoRef.current;
        if (!video || video.srcObject) return;
        video.srcObject = streamRef.current;
        video.play().catch(() => {});
    }, [camPermission]);

    // Camera + MediaPipe lifecycle: restart if user went back then returned
    useEffect(() => {
        if (modalView === "form" && formStep === 3 && camPermission === "granted") {
            if (!streamRef.current) {
                // Stream was stopped (back navigation), restart without permission prompt
                setFacePhaseIdx(0);
                setCapturedFaces({});
                setCountdown(0);
                startCamera();
                loadMediaPipe();
            }
        } else if (!(modalView === "form" && formStep === 3)) {
            stopCamera();
        }
        return () => { stopCamera(); };
    }, [modalView, formStep, camPermission, startCamera, stopCamera, loadMediaPipe]);

    const allFacesCaptured = FACE_PHASES.every(p => capturedFaces[p.key]);

    // ── face-api.js: preload models in background ──────────────
    const faceApiLoadedRef = useRef(false);
    const faceApiLoadingRef = useRef(false);

    const preloadFaceApi = useCallback(async () => {
        if (faceApiLoadedRef.current || faceApiLoadingRef.current) return;
        faceApiLoadingRef.current = true;
        try {
            const faceapi = await import("@vladmandic/face-api");
            const MODEL_URL = "/face-models";
            if (!faceapi.nets.ssdMobilenetv1.isLoaded) {
                await Promise.all([
                    faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
                    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
                ]);
            }
            faceApiLoadedRef.current = true;
        } catch (e) {
            console.warn("face-api preload failed", e);
        } finally {
            faceApiLoadingRef.current = false;
        }
    }, []);

    // Start preloading face-api models as soon as step 3 is entered
    useEffect(() => {
        if (formStep === 3) preloadFaceApi();
    }, [formStep, preloadFaceApi]);

    // ── face-api.js: extract 128-float descriptor from front face ──
    const extractFaceDescriptor = useCallback(async (dataUrl: string): Promise<number[] | null> => {
        try {
            const faceapi = await import("@vladmandic/face-api");
            const MODEL_URL = "/face-models";
            if (!faceapi.nets.ssdMobilenetv1.isLoaded) {
                await Promise.all([
                    faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
                    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
                ]);
            }
            const img = document.createElement("img");
            img.src = dataUrl;
            await new Promise<void>(resolve => { img.onload = () => resolve(); });
            const det = await faceapi
                .detectSingleFace(img)
                .withFaceLandmarks()
                .withFaceDescriptor();
            if (!det) return null;
            return Array.from(det.descriptor);
        } catch (e) {
            console.error("face-api error", e);
            return null;
        }
    }, []);

    // ── Auth ────────────────────────────────────────────────
    const handleAuth = async () => {
        setAuthError("");
        if (!authEmail.trim()) { setAuthError("Введите Email"); return; }

        // LOGIN — direct, no OTP
        if (authTab === "login") {
            if (!authPassword || authPassword.length < 6) { setAuthError("Пароль минимум 6 символов"); return; }
            setAuthLoading(true);
            try {
                const res  = await fetch(`${GO_API_URL}/api/login`, { method: "POST", headers: { "Content-Type": "application/json" },
                                                body: JSON.stringify({ email: authEmail.trim().toLowerCase(), password: authPassword }) });
                const data = await res.json();
                if (res.ok && data.token) { saveToken(data.token); setUserEmail(data.user?.email || authEmail); openForm(data.token); }
                else setAuthError(data.error || "Неверный Email или пароль");
            } finally { setAuthLoading(false); }
            return;
        }

        // REGISTER — send OTP first
        if (!authPassword || authPassword.length < 6) { setAuthError("Пароль минимум 6 символов"); return; }
        if (authPassword !== authConfirm) { setAuthError("Пароли не совпадают"); return; }
        setAuthLoading(true);
        try {
            const res  = await fetch(`${GO_API_URL}/api/quick-auth`, { method: "POST", headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify({ email: authEmail.trim().toLowerCase() }) });
            const data = await res.json();
            if (res.ok) {
                setPendingPassword(authPassword);
                setOtpCode("");
                setAuthStep("otp");
            } else {
                setAuthError(data.error || "Произошла ошибка");
            }
        } finally { setAuthLoading(false); }
    };

    const handleOtpVerify = async () => {
        setAuthError("");
        if (otpCode.length < 4) { setAuthError("Введите правильный код"); return; }
        setAuthLoading(true);
        try {
            const res  = await fetch(`${GO_API_URL}/api/quick-verify`, { method: "POST", headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify({ email: authEmail.trim().toLowerCase(), code: otpCode }) });
            const data = await res.json();
            if (!res.ok) { setAuthError(data.error || "Неверный код"); return; }

            const token = data.token;
            // If new user, set their password
            if (data.needs_password && pendingPassword) {
                await fetch(`${GO_API_URL}/api/user/set-password`, {
                    method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ password: pendingPassword }),
                });
            }
            saveToken(token);
            setUserEmail(data.user?.email || authEmail);
            openForm(token);
        } finally { setAuthLoading(false); }
    };

    // Load existing profile and pre-fill form, skip steps 1-2 if data exists
    const openForm = async (tokenOverride?: string) => {
        const token = tokenOverride || getToken();
        setFormError(""); setCertFile(null); setCertPreview(null);
        setForm({ fio: "", school: "", class_name: "", birth_date: "", phone: "", certificate_url: "" });
        setHasExistingProfile(false);

        if (token) {
            try {
                const res = await fetch(`${GO_API_URL}/api/my-profile-data`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) {
                    const d = await res.json();
                    setForm({
                        fio: d.fio || "",
                        school: d.school || "",
                        class_name: d.class_name || "",
                        birth_date: d.birth_date || "",
                        phone: d.phone || "",
                        certificate_url: d.certificate_url || "",
                    });
                    setHasExistingProfile(true);
                    setFormStep(3); // skip to face scan
                    setModalView("form");
                    return;
                }
            } catch { /* no previous data, show full form */ }
        }

        setFormStep(1);
        setModalView("form");
    };

    const handleOpen = () => {
        const token = getToken();
        if (token) { const c = decodeToken(token); if (c?.email) setUserEmail(c.email); openForm(); }
        else { setAuthEmail(""); setAuthPassword(""); setAuthConfirm(""); setAuthError(""); setOtpCode(""); setAuthTab("register"); setAuthStep("credentials"); setModalView("auth"); }
    };

    const closeModal = () => { stopCamera(); setModalView(null); setCamPermission("prompt"); }

    // Called directly from user gesture (button tap) — iOS requires getUserMedia inside user gesture
    const requestAndStartCamera = useCallback(async () => {
        setCamPermission("requesting");
        setCameraError("");
        try {
            const s = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
            });
            streamRef.current = s;
            // Set state → React renders video element → srcObject useEffect attaches stream
            setCamPermission("granted");
            setFacePhaseIdx(0);
            setCapturedFaces({});
            setCountdown(0);
            loadMediaPipe();
        } catch {
            streamRef.current = null;
            setCamPermission("denied");
        }
    }, [loadMediaPipe]);

    const handleCertSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]; if (!file) return;
        setCertFile(file);
        if (file.type.startsWith("image/")) { const r = new FileReader(); r.onload = ev => setCertPreview(ev.target?.result as string); r.readAsDataURL(file); }
        else setCertPreview(null);
    };

    const goNextStep = async () => {
        setFormError("");
        if (formStep === 1) {
            if (!form.fio.trim())       { setFormError("Заполните ФИО"); return; }
            if (!form.school.trim())    { setFormError("Заполните школу"); return; }
            if (!form.class_name.trim()){ setFormError("Заполните класс"); return; }
            if (!form.birth_date)       { setFormError("Выберите дату рождения"); return; }
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
        if (!allFacesCaptured) { setFormError("Сфотографируйтесь с трёх сторон"); return; }
        setSubmitting(true); setFacesUploading(true);
        try {
            // Extract 128-float face descriptor from front face
            const descriptor = await extractFaceDescriptor(capturedFaces.front!);
            setFacesUploading(false);
            if (!descriptor) {
                setFormError("Лицо не распознано. Встаньте ближе в хорошо освещённом месте.");
                return;
            }
            const token = getToken();
            const res = await fetch(`${GO_API_URL}/api/olympiads/${id}/apply`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    ...form,
                    email: userEmail,
                    face_embeddings: JSON.stringify(descriptor), // 128 floats
                }),
            });
            const data = await res.json();
            if (res.ok) { stopCamera(); setModalView("done"); setAppStatus("pending"); }
            else setFormError(data.error || "Произошла ошибка");
        } finally { setSubmitting(false); setFacesUploading(false); }
    };

    // ── Pose UI helpers ─────────────────────────────────────
    const poseColor = (p: PoseResult | null, phase: typeof FACE_PHASES[number]) => {
        if (!p) return "#94a3b8";
        if (!p.faceDetected) return "#94a3b8";
        if (!p.lightingOk) return "#f97316";
        if (p.angleOk) return "#22c55e";
        // how close to target
        const mid = (phase.yawMin + phase.yawMax) / 2;
        const dist = Math.abs(p.yaw - mid);
        return dist < 0.2 ? "#84cc16" : "#f97316";
    };

    const poseLabel = (p: PoseResult | null) => {
        if (!p) return "Встаньте перед камерой...";
        if (!p.faceDetected) return "Лицо не найдено — подойдите ближе";
        if (p.brightness < 50) return "Слишком темно — встаньте к свету";
        if (p.brightness > 230) return "Слишком ярко — отойдите назад";
        if (p.angleOk) return "Верно! Не двигайтесь...";
        const phase = FACE_PHASES[facePhaseIdx];
        if (phase.dirIcon === "left")  return "Поверните голову влево ←";
        if (phase.dirIcon === "right") return "Поверните голову вправо →";
        return "Держите лицо прямо";
    };

    // Yaw visual bar: -1..+1 maps to 0..100%
    const yawPercent = (yaw: number) => Math.round(Math.min(100, Math.max(0, (yaw + 1) / 2 * 100)));

    // ── Render helpers ──────────────────────────────────────
    if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(145deg,#f0f4ff,#faf5ff)" }}><p className="text-slate-400 font-bold animate-pulse">Загрузка...</p></div>;
    if (!olympiad) return <div className="min-h-screen flex items-center justify-center"><p className="text-2xl font-black text-slate-700">Олимпиада не найдена</p></div>;

    const isOnline = olympiad.format === "Онлайн";
    const prizes = [
        { label: "1 место", emoji: "🥇", value: olympiad.prize_1, fallback: "Золотая медаль & Ценный подарок", bg: "from-yellow-50 to-amber-50", border: "border-yellow-300", text: "text-yellow-700" },
        { label: "2 место", emoji: "🥈", value: olympiad.prize_2, fallback: "Серебряная медаль & Диплом",       bg: "from-slate-50 to-gray-100",  border: "border-slate-300",  text: "text-slate-600"  },
        { label: "3 место", emoji: "🥉", value: olympiad.prize_3, fallback: "Бронзовая медаль & Сертификат",   bg: "from-orange-50 to-amber-50", border: "border-orange-300", text: "text-orange-700" },
    ];

    const statusBanner = appStatus && (() => {
        const m = { pending: { bg: "bg-amber-50 border-amber-200 text-amber-700", icon: "solar:clock-circle-bold-duotone", msg: "Ваша заявка отправлена. Администратор проверит." }, approved: { bg: "bg-green-50 border-green-200 text-green-700", icon: "solar:check-circle-bold-duotone", msg: "Ваша заявка одобрена!" }, rejected: { bg: "bg-red-50 border-red-200 text-red-700", icon: "solar:close-circle-bold-duotone", msg: "Ваша заявка отклонена." } }[appStatus];
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

    const currentPhase = FACE_PHASES[facePhaseIdx];
    const ovalColor = poseColor(poseResult, currentPhase);

    return (
        <main className="min-h-screen pb-24" style={{ background: "linear-gradient(145deg,#f0f4ff 0%,#faf5ff 35%,#f0fdf4 65%,#fff7ed 100%)" }}>
            <div className="pointer-events-none fixed inset-0" style={{ backgroundImage: "radial-gradient(circle,rgba(99,102,241,0.1) 1px,transparent 1px)", backgroundSize: "36px 36px" }} />
            <div className="pointer-events-none fixed inset-0 overflow-hidden">
                <div style={{ position:"absolute", top:"-10%", right:"-5%", width:"500px", height:"500px", borderRadius:"50%", background:"radial-gradient(circle,rgba(167,139,250,0.25) 0%,transparent 70%)", filter:"blur(60px)" }} />
                <div style={{ position:"absolute", bottom:"10%", left:"-5%", width:"400px", height:"400px", borderRadius:"50%", background:"radial-gradient(circle,rgba(6,182,212,0.18) 0%,transparent 70%)", filter:"blur(60px)" }} />
            </div>

            <div className="relative z-10 pt-32 container mx-auto px-4">
                <a href="/olympiads" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-violet-600 transition-colors mb-8 group">
                    {mounted && <Icon icon="solar:arrow-left-bold-duotone" width={18} className="group-hover:-translate-x-1 transition-transform" />}
                    Назад к олимпиадам
                </a>

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
                            {olympiad.status === "registration" && <span className="px-4 py-1.5 bg-blue-50 border border-blue-200 text-blue-600 rounded-full text-xs font-black uppercase tracking-wider animate-pulse">Запись открыта</span>}
                        </div>
                        <h1 className="text-3xl md:text-5xl font-black text-slate-900 leading-tight">{olympiad.title}</h1>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="flex items-center gap-4 glass-card p-4 rounded-2xl">
                                <div className="p-3 rounded-xl" style={{ background:"rgba(124,58,237,0.08)" }}>{mounted && <Icon icon="solar:calendar-date-bold-duotone" width={22} style={{ color:"#7c3aed" }} />}</div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Дата проведения</p>
                                    <p className="text-sm font-black text-slate-800">
                                        {olympiad.start_time ? fmtDateTime(olympiad.start_time) : (olympiad.date || "Уточняется")}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 glass-card p-4 rounded-2xl">
                                <div className="p-3 rounded-xl" style={{ background:"rgba(239,68,68,0.07)" }}>{mounted && <Icon icon="solar:map-point-bold-duotone" width={22} className="text-rose-500" />}</div>
                                <div className="min-w-0"><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Место проведения</p><p className="text-sm font-black text-slate-800 truncate">{olympiad.location || "Адрес уточняется"}</p></div>
                            </div>
                        </div>
                        {statusBanner}
                        <div className="flex flex-col sm:flex-row gap-4 pt-2">
                            {olympiad.status !== "registration" ? (
                                <div className="flex-1 px-8 py-4 bg-slate-100 text-slate-400 font-black rounded-2xl text-sm text-center cursor-not-allowed">
                                    {olympiad.status === "active" ? "Регистрация закрыта" : olympiad.status === "finished" ? "Олимпиада завершена" : "Регистрация не открыта"}
                                </div>
                            ) : !appStatus ? (
                                <button onClick={handleOpen} className="flex-1 px-8 py-4 font-black rounded-2xl text-white text-sm shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]" style={{ background:"linear-gradient(135deg,#7c3aed,#0ea5e9)", boxShadow:"0 10px 30px rgba(124,58,237,0.3)" }}>
                                    Участвовать в олимпиаде
                                </button>
                            ) : null}
                            {olympiad.file_url && (
                                <a href={olympiad.file_url} target="_blank" rel="noopener noreferrer" className="px-6 py-4 bg-white border-2 border-slate-200 text-slate-700 font-bold rounded-2xl hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 text-sm shadow-sm">
                                    {mounted && <Icon icon="solar:document-download-bold" className="text-emerald-500" width={20} />} Скачать положение
                                </a>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 border-t border-slate-200/60 pt-12">
                    <div className="lg:col-span-2 space-y-8">
                        <div className="glass-card p-8 rounded-[2rem]">
                            <h3 className="text-xl font-black text-slate-800 mb-4 flex items-center gap-2">{mounted && <Icon icon="solar:info-circle-bold-duotone" className="text-violet-500" width={22} />}Олимпиада тууралуу</h3>
                            <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">{olympiad.description || "Подробная информация об олимпиаде скоро появится."}</p>
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
                    <div className="glass-card rounded-[2rem] p-8">
                        <h4 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">{mounted && <Icon icon="solar:shield-check-bold-duotone" className="text-violet-500" width={22} />}Негизги эрежелер</h4>
                        <div className="space-y-3">
                            {["Опоздание после начала олимпиады недопустимо.", "Участник должен принести ручку и блокнот.", "Результаты будут опубликованы в течение 3 рабочих дней."].map((rule, i) => (
                                <div key={i} className="flex items-start gap-3 bg-slate-50 p-4 rounded-2xl">
                                    <div className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-black text-white mt-0.5" style={{ background:"linear-gradient(135deg,#7c3aed,#0ea5e9)" }}>{i + 1}</div>
                                    <p className="text-xs font-semibold text-slate-600">{rule}</p>
                                </div>
                            ))}
                        </div>
                        <div className="mt-6 p-5 rounded-2xl text-white text-center" style={{ background:"linear-gradient(135deg,#7c3aed,#0ea5e9)", boxShadow:"0 8px 24px rgba(124,58,237,0.25)" }}>
                            <p className="text-xs font-bold leading-snug">Каждому участнику выдаётся цифровой сертификат с QR-кодом</p>
                        </div>
                    </div>
                </div>

                {/* ══════════════ RESULTS SECTION ══════════════ */}
                {olympiad.status === "finished" && (
                    <div className="mt-14 border-t border-slate-200/60 pt-12">
                        <div className="flex items-center gap-3 mb-8">
                            {mounted && <Icon icon="solar:cup-star-bold-duotone" width={32} className="text-amber-500" />}
                            <div>
                                <h2 className="text-2xl md:text-3xl font-black text-slate-900">Результаты и победители</h2>
                                <p className="text-sm text-slate-400 font-medium mt-0.5">Итоговый рейтинг участников</p>
                            </div>
                        </div>

                        {resultsLoading ? (
                            <div className="flex items-center justify-center py-16">
                                <div className="animate-spin w-10 h-10 border-2 border-violet-400 border-t-transparent rounded-full" />
                            </div>
                        ) : results.length === 0 ? (
                            <div className="glass-card rounded-[2rem] p-10 text-center">
                                <div className="text-5xl mb-3">📊</div>
                                <p className="text-slate-500 font-bold">Результаты ещё не опубликованы</p>
                            </div>
                        ) : (
                            <>
                                {/* Top 3 Podium */}
                                {results.length >= 1 && (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
                                        {[
                                            { data: results[0], place: 1, emoji: "🥇", grad: "from-yellow-400 to-amber-500", bg: "from-yellow-50 to-amber-50", border: "border-yellow-300", shadow: "shadow-yellow-200/60", size: "md:order-2" },
                                            { data: results[1], place: 2, emoji: "🥈", grad: "from-slate-400 to-slate-500", bg: "from-slate-50 to-gray-100",  border: "border-slate-300",  shadow: "shadow-slate-200/60",  size: "md:order-1" },
                                            { data: results[2], place: 3, emoji: "🥉", grad: "from-orange-400 to-amber-500", bg: "from-orange-50 to-amber-50", border: "border-orange-300", shadow: "shadow-orange-200/60", size: "md:order-3" },
                                        ].filter(p => p.data).map(({ data, place, emoji, grad, bg, border, shadow, size }) => (
                                            <div key={place} className={`relative bg-gradient-to-br ${bg} border-2 ${border} rounded-[2rem] p-6 text-center shadow-xl ${shadow} ${size} ${place === 1 ? "md:scale-105 md:-mt-3" : ""}`}>
                                                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${grad} flex items-center justify-center text-2xl mx-auto mb-3 shadow-lg`}>
                                                    {emoji}
                                                </div>
                                                <div className="absolute top-4 right-4 text-xs font-black text-white px-2 py-0.5 rounded-full" style={{ background: `linear-gradient(135deg,#7c3aed,#0ea5e9)` }}>
                                                    #{place}
                                                </div>
                                                <h3 className="font-black text-slate-800 text-base leading-tight">{data.fio}</h3>
                                                <p className="text-xs text-slate-500 font-medium mt-1">{data.school}</p>
                                                <p className="text-xs text-slate-400 font-medium">{data.class_name}</p>
                                                <div className="mt-4 pt-4 border-t border-white/60">
                                                    <div className="text-3xl font-black text-slate-800">{data.percentage}<span className="text-lg text-slate-400">%</span></div>
                                                    <p className="text-xs text-slate-500 font-bold mt-0.5">{data.score} / {data.max_score} баллов</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Full leaderboard table */}
                                <div className="glass-card rounded-[2rem] overflow-hidden">
                                    <div className="px-6 py-4 border-b border-slate-200/60 flex items-center gap-2">
                                        {mounted && <Icon icon="solar:list-bold-duotone" className="text-violet-500" width={20} />}
                                        <h4 className="font-black text-slate-800 text-sm">Полный рейтинг</h4>
                                        <span className="ml-auto text-xs text-slate-400 font-bold">{results.length} участников</span>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="bg-slate-50/80 text-left">
                                                    <th className="px-4 py-3 text-xs font-black text-slate-400 uppercase tracking-wider w-12">#</th>
                                                    <th className="px-4 py-3 text-xs font-black text-slate-400 uppercase tracking-wider">Участник</th>
                                                    <th className="px-4 py-3 text-xs font-black text-slate-400 uppercase tracking-wider hidden sm:table-cell">Школа / Класс</th>
                                                    <th className="px-4 py-3 text-xs font-black text-slate-400 uppercase tracking-wider text-right">Баллы</th>
                                                    <th className="px-4 py-3 text-xs font-black text-slate-400 uppercase tracking-wider text-right">%</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {results.map((r) => (
                                                    <tr key={r.rank} className={`transition-colors hover:bg-violet-50/30 ${r.rank <= 3 ? "bg-amber-50/30" : ""}`}>
                                                        <td className="px-4 py-3 font-black text-center">
                                                            {r.rank === 1 ? "🥇" : r.rank === 2 ? "🥈" : r.rank === 3 ? "🥉" : (
                                                                <span className="text-slate-400 text-xs">{r.rank}</span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <p className="font-black text-slate-800 text-sm">{r.fio}</p>
                                                        </td>
                                                        <td className="px-4 py-3 hidden sm:table-cell">
                                                            <p className="text-xs text-slate-600 font-semibold">{r.school}</p>
                                                            <p className="text-xs text-slate-400">{r.class_name}</p>
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            <span className="font-black text-slate-800">{r.score}</span>
                                                            <span className="text-slate-400 text-xs">/{r.max_score}</span>
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-black ${r.rank === 1 ? "bg-yellow-100 text-yellow-700" : r.rank === 2 ? "bg-slate-100 text-slate-600" : r.rank === 3 ? "bg-orange-100 text-orange-700" : "bg-violet-50 text-violet-600"}`}>
                                                                {r.percentage}%
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* ── RELATED OLYMPIADS ── */}
                {otherOlympiads.length > 0 && (
                    <RelatedSectionBlock title="Другие олимпиады">
                        {otherOlympiads.map((o) => (
                            <RelatedOlympiadCard key={o.ID} olympiad={o} />
                        ))}
                    </RelatedSectionBlock>
                )}
            </div>

            {/* ══════════════ MODAL ══════════════ */}
            {modalView && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="glass-card rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl w-full max-w-lg max-h-[95vh] overflow-y-auto">

                        {/* Header */}
                        <div className="p-5 border-b border-white/40 flex items-center justify-between sticky top-0 glass-nav rounded-t-[2.5rem] z-10">
                            <div>
                                <h2 className="text-lg font-black text-slate-800">
                                    {modalView === "auth" && authStep === "otp" && "Email верификация"}
                                    {modalView === "auth" && authStep === "credentials" && (authTab === "register" ? "Регистрация" : "Вход")}
                                    {modalView === "form" && formStep === 1 && "Личные данные"}
                                    {modalView === "form" && formStep === 2 && "Справка из школы"}
                                    {modalView === "form" && formStep === 3 && "Верификация лица"}
                                    {modalView === "done" && "Заявка отправлена"}
                                </h2>
                                {modalView === "form" && <p className="text-xs text-violet-600 font-bold truncate max-w-xs">{userEmail}</p>}
                            </div>
                            <button onClick={closeModal} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold transition-colors flex-shrink-0">✕</button>
                        </div>

                        <div className="p-5">

                            {/* ── AUTH ── */}
                            {modalView === "auth" && (
                                <div>
                                    {/* Tab switcher — only show on credentials step */}
                                    {authStep === "credentials" && (
                                        <div className="flex bg-slate-100 rounded-2xl p-1 mb-5">
                                            {(["register","login"] as AuthTab[]).map(tab => (
                                                <button key={tab} onClick={() => { setAuthTab(tab); setAuthError(""); setAuthStep("credentials"); }}
                                                    className={`flex-1 py-2.5 rounded-xl text-sm font-black transition-all ${authTab === tab ? "bg-white shadow text-violet-600" : "text-slate-500 hover:text-slate-700"}`}>
                                                    {tab === "register" ? "Регистрация" : "Войти"}
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {/* ── CREDENTIALS step ── */}
                                    {authStep === "credentials" && (
                                        <div className="space-y-3">
                                            <div><label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5">Email</label>
                                                <input type="email" autoFocus className="w-full px-4 py-3 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-400 placeholder:text-slate-300" placeholder="email@example.com" value={authEmail} onChange={e => { setAuthEmail(e.target.value); setAuthError(""); }} /></div>
                                            <div><label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5">Пароль</label>
                                                <input type="password" className="w-full px-4 py-3 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-400 placeholder:text-slate-300" placeholder="Минимум 6 символов" value={authPassword} onChange={e => { setAuthPassword(e.target.value); setAuthError(""); }} /></div>
                                            {authTab === "register" && (
                                                <div><label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5">Повторите пароль</label>
                                                    <input type="password" className="w-full px-4 py-3 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-400 placeholder:text-slate-300" placeholder="Повторите пароль" value={authConfirm} onChange={e => { setAuthConfirm(e.target.value); setAuthError(""); }} onKeyDown={e => e.key === "Enter" && handleAuth()} /></div>
                                            )}
                                            {authError && <p className="text-sm text-red-500 font-bold bg-red-50 p-3 rounded-xl">{authError}</p>}
                                            <button onClick={handleAuth} disabled={authLoading} className="w-full py-4 rounded-2xl font-black text-white mt-1 disabled:opacity-60" style={{ background:"linear-gradient(135deg,#7c3aed,#0ea5e9)" }}>
                                                {authLoading ? "Загрузка..." : authTab === "register" ? "Отправить код на Email →" : "Войти и продолжить →"}
                                            </button>
                                            {authTab === "register" ? (
                                                <p className="text-center text-xs text-slate-400 pt-1">Уже есть аккаунт?{" "}<button onClick={() => { setAuthTab("login"); setAuthError(""); }} className="text-violet-600 font-bold hover:underline">Войти</button></p>
                                            ) : (
                                                <p className="text-center text-xs text-slate-400 pt-1">Нет аккаунта?{" "}<button onClick={() => { setAuthTab("register"); setAuthError(""); }} className="text-violet-600 font-bold hover:underline">Зарегистрироваться</button></p>
                                            )}
                                        </div>
                                    )}

                                    {/* ── OTP step ── */}
                                    {authStep === "otp" && (
                                        <div className="space-y-4">
                                            <div className="bg-violet-50 border border-violet-200 rounded-2xl p-4 text-center">
                                                <p className="text-2xl mb-2">📧</p>
                                                <p className="text-sm font-black text-violet-700">Код отправлен!</p>
                                                <p className="text-xs text-violet-500 mt-1">
                                                    <span className="font-bold">{authEmail}</span> отправлен 6-значный код
                                                </p>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5">Код</label>
                                                <input
                                                    type="text"
                                                    autoFocus
                                                    maxLength={6}
                                                    inputMode="numeric"
                                                    className="w-full px-4 py-4 border border-slate-200 rounded-2xl text-2xl font-black text-slate-800 text-center tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-violet-400 placeholder:text-slate-300 placeholder:text-base placeholder:tracking-normal"
                                                    placeholder="------"
                                                    value={otpCode}
                                                    onChange={e => { setOtpCode(e.target.value.replace(/\D/g,"")); setAuthError(""); }}
                                                    onKeyDown={e => e.key === "Enter" && handleOtpVerify()}
                                                />
                                            </div>
                                            {authError && <p className="text-sm text-red-500 font-bold bg-red-50 p-3 rounded-xl">{authError}</p>}
                                            <button onClick={handleOtpVerify} disabled={authLoading || otpCode.length < 4} className="w-full py-4 rounded-2xl font-black text-white disabled:opacity-60" style={{ background:"linear-gradient(135deg,#7c3aed,#0ea5e9)" }}>
                                                {authLoading ? "Проверка..." : "Подтвердить и продолжить →"}
                                            </button>
                                            <button onClick={() => { setAuthStep("credentials"); setAuthError(""); setOtpCode(""); }} className="w-full py-2 text-xs font-bold text-slate-400 hover:text-slate-600">
                                                ← Назад
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ── FORM ── */}
                            {modalView === "form" && (
                                <div>
                                    {hasExistingProfile && formStep === 3 ? (
                                        /* Pre-filled profile banner */
                                        <div className="bg-violet-50 border border-violet-200 rounded-2xl p-4 mb-4 flex items-start gap-3">
                                            <span className="text-lg flex-shrink-0">👤</span>
                                            <div>
                                                <p className="text-xs font-black text-violet-700 mb-0.5">Данные заполнены автоматически</p>
                                                <p className="text-xs text-violet-500 font-medium">{form.fio} · {form.school} · {form.class_name}</p>
                                                <button onClick={() => { setHasExistingProfile(false); setFormStep(1); }} className="text-[10px] text-violet-400 hover:text-violet-600 underline mt-0.5">Изменить данные</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <StepBar current={formStep} total={3} />
                                    )}

                                    {/* STEP 1 */}
                                    {formStep === 1 && (
                                        <div className="space-y-4">
                                            {[{ f:"fio", l:"Полное ФИО *", p:"Иванов Иван Иванович" }, { f:"school", l:"Школа *", p:"Школа №65, Бишкек" }, { f:"class_name", l:"Класс *", p:"10-А" }, { f:"phone", l:"Телефон", p:"+996 700 123 456" }].map(({ f, l, p }) => (
                                                <div key={f}><label className="block text-xs font-bold text-slate-500 mb-1.5">{l}</label>
                                                    <input type="text" className="w-full px-4 py-3 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-400 placeholder:text-slate-300" placeholder={p} value={form[f as keyof RegForm]} onChange={e => { setForm(prev => ({ ...prev, [f]: e.target.value })); setFormError(""); }} /></div>
                                            ))}
                                            <div><label className="block text-xs font-bold text-slate-500 mb-1.5">Дата рождения *</label>
                                                <input type="date" className="w-full px-4 py-3 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-400" value={form.birth_date} max={new Date().toISOString().split("T")[0]} onChange={e => { setForm(prev => ({ ...prev, birth_date: e.target.value })); setFormError(""); }} /></div>
                                            {formError && <p className="text-sm text-red-500 font-bold bg-red-50 p-3 rounded-xl">{formError}</p>}
                                            <button onClick={goNextStep} className="w-full py-4 rounded-2xl font-black text-white" style={{ background:"linear-gradient(135deg,#7c3aed,#0ea5e9)" }}>Далее →</button>
                                        </div>
                                    )}

                                    {/* STEP 2 */}
                                    {formStep === 2 && (
                                        <div className="space-y-4">
                                            <div>
                                                <p className="text-xs font-black text-slate-500 uppercase tracking-wider mb-1">Справка из школы</p>
                                                <p className="text-xs text-slate-400 mb-3">Нужна печать школы и подпись директора (фото или PDF)</p>
                                            </div>
                                            <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center cursor-pointer hover:border-violet-400 hover:bg-violet-50/30 transition-all">
                                                {certPreview ? <img src={certPreview} alt="cert" className="max-h-48 mx-auto rounded-xl object-contain" />
                                                    : certFile ? <><p className="text-4xl mb-2">📄</p><p className="text-sm font-bold text-slate-600">{certFile.name}</p></>
                                                    : <><p className="text-4xl mb-3">📎</p><p className="text-sm font-bold text-slate-600">Загрузить документ</p><p className="text-xs text-slate-400 mt-1">PNG, JPG или PDF • макс. 10 МБ</p></>}
                                                <input ref={fileInputRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleCertSelect} />
                                            </div>
                                            {certFile && <button onClick={() => { setCertFile(null); setCertPreview(null); }} className="text-xs text-red-500 font-bold hover:underline">✕ Удалить файл</button>}
                                            {formError && <p className="text-sm text-red-500 font-bold bg-red-50 p-3 rounded-xl">{formError}</p>}
                                            <div className="flex gap-3">
                                                <button onClick={() => setFormStep(1)} className="px-5 py-3 bg-slate-100 rounded-2xl font-bold text-sm text-slate-600 hover:bg-slate-200 transition-colors">← Назад</button>
                                                <button onClick={goNextStep} disabled={uploading} className="flex-1 py-3 rounded-2xl font-black text-white disabled:opacity-60" style={{ background:"linear-gradient(135deg,#7c3aed,#0ea5e9)" }}>{uploading ? "Загрузка..." : "Далее →"}</button>
                                            </div>
                                        </div>
                                    )}

                                    {/* ── STEP 3: FACE CAPTURE (MediaPipe) ── */}
                                    {formStep === 3 && (
                                        <div className="space-y-3">

                                            {/* ── PERMISSION PROMPT ── */}
                                            {camPermission !== "granted" && (
                                                <div className="py-4">
                                                    {camPermission === "denied" ? (
                                                        <div className="space-y-4">
                                                            <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-center">
                                                                <div className="text-5xl mb-3">🚫</div>
                                                                <p className="text-sm font-black text-red-700 mb-1">Доступ к камере запрещён</p>
                                                                <p className="text-xs text-red-500 leading-relaxed">
                                                                    Нажмите 🔒 или 📷 в адресной строке браузера → Камера → Разрешить
                                                                </p>
                                                            </div>
                                                            <button onClick={requestAndStartCamera}
                                                                className="w-full py-3.5 rounded-2xl font-black text-white text-sm"
                                                                style={{ background:"linear-gradient(135deg,#7c3aed,#0ea5e9)" }}>
                                                                Попробовать снова
                                                            </button>
                                                            <button
                                                                onClick={() => { setFormStep(hasExistingProfile ? 1 : 2); setHasExistingProfile(false); }}
                                                                className="w-full py-3 bg-slate-100 rounded-2xl font-bold text-sm text-slate-600 hover:bg-slate-200 transition-colors">
                                                                ← Назад
                                                            </button>
                                                        </div>
                                                    ) : camPermission === "requesting" ? (
                                                        <div className="bg-violet-50 border border-violet-200 rounded-2xl p-8 text-center">
                                                            <div className="animate-spin w-10 h-10 border-2 border-violet-400 border-t-transparent rounded-full mx-auto mb-4" />
                                                            <p className="text-sm font-bold text-violet-700">Уруксат сурануудa...</p>
                                                            <p className="text-xs text-violet-400 mt-1">Нажмите 'Разрешить' в запросе браузера</p>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-5">
                                                            <div className="text-center">
                                                                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4"
                                                                    style={{ background:"linear-gradient(135deg,rgba(124,58,237,0.1),rgba(14,165,233,0.1))" }}>
                                                                    <span className="text-4xl">📷</span>
                                                                </div>
                                                                <h3 className="text-base font-black text-slate-800 mb-2">Нужен доступ к камере</h3>
                                                                <p className="text-sm text-slate-500 leading-relaxed">
                                                                    Для верификации лица необходим доступ к камере
                                                                </p>
                                                            </div>
                                                            <div className="space-y-2.5">
                                                                {[
                                                                    { icon:"🛡️", title:"Безопасность", desc:"Ваше лицо используется только для входа в олимпиаду" },
                                                                    { icon:"🔒", title:"Конфиденциальность", desc:"Ваше фото хранится в зашифрованном виде" },
                                                                    { icon:"✅", title:"Однократно", desc:"Делается только при первой регистрации" },
                                                                ].map(({ icon, title, desc }) => (
                                                                    <div key={title} className="flex items-start gap-3 bg-slate-50 rounded-xl p-3">
                                                                        <span className="text-xl flex-shrink-0">{icon}</span>
                                                                        <div>
                                                                            <p className="text-xs font-black text-slate-700">{title}</p>
                                                                            <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                            <button onClick={requestAndStartCamera}
                                                                className="w-full py-4 rounded-2xl font-black text-white text-base shadow-lg transition-transform active:scale-[0.98]"
                                                                style={{ background:"linear-gradient(135deg,#7c3aed,#0ea5e9)", boxShadow:"0 10px 30px rgba(124,58,237,0.3)" }}>
                                                                📷 Разрешить доступ к камере
                                                            </button>
                                                            <button
                                                                onClick={() => { setFormStep(hasExistingProfile ? 1 : 2); setHasExistingProfile(false); }}
                                                                className="w-full py-3 bg-slate-100 rounded-2xl font-bold text-sm text-slate-600 hover:bg-slate-200 transition-colors">
                                                                ← Назад
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Only show face capture UI when permission is granted */}
                                            {camPermission === "granted" && <>

                                            {/* Phase tabs */}
                                            <div className="flex gap-2 mb-1">
                                                {FACE_PHASES.map((p, i) => (
                                                    <div key={p.key} className={`flex-1 py-2 rounded-xl text-xs font-black text-center transition-all border ${capturedFaces[p.key] ? "bg-emerald-50 border-emerald-300 text-emerald-600" : i === facePhaseIdx ? "border-violet-300 text-violet-700" : "bg-slate-50 border-slate-200 text-slate-400"}`}
                                                        style={i === facePhaseIdx && !capturedFaces[p.key] ? { background:"rgba(124,58,237,0.06)" } : {}}>
                                                        {capturedFaces[p.key] ? "✓ " : ""}{p.key === "front" ? "Прямо" : p.key === "left" ? "Влево" : "Вправо"}
                                                    </div>
                                                ))}
                                            </div>

                                            {/* MediaPipe loading state */}
                                            {mpLoading && !cameraError && (
                                                <div className="bg-violet-50 border border-violet-200 rounded-2xl p-4 text-center">
                                                    <div className="animate-spin w-6 h-6 border-2 border-violet-400 border-t-transparent rounded-full mx-auto mb-2" />
                                                    <p className="text-xs font-bold text-violet-600">Загрузка AI модели...</p>
                                                </div>
                                            )}

                                            {cameraError ? (
                                                <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
                                                    <p className="text-4xl mb-3">📷</p>
                                                    <p className="text-sm font-bold text-red-600">{cameraError}</p>
                                                    <button onClick={() => { startCamera(); loadMediaPipe(); }} className="mt-4 px-5 py-2 bg-red-500 text-white rounded-xl font-bold text-sm">Попробовать снова</button>
                                                </div>
                                            ) : (
                                                <>
                                                    {/* Camera viewport */}
                                                    <div className="relative rounded-2xl overflow-hidden bg-slate-900 select-none" style={{ aspectRatio:"4/3" }}>
                                                        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
                                                        <canvas ref={canvasRef} className="hidden" />

                                                        {/* Oval guide — color shows angle match */}
                                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                            <div className="rounded-full transition-all duration-200"
                                                                style={{
                                                                    width:"56%", height:"78%",
                                                                    border:`3px solid ${ovalColor}`,
                                                                    boxShadow: poseResult?.angleOk
                                                                        ? `0 0 0 2000px rgba(0,0,0,0.38), 0 0 24px 6px ${ovalColor}60`
                                                                        : "0 0 0 2000px rgba(0,0,0,0.48)",
                                                                }} />
                                                        </div>

                                                        {/* Yaw angle bar — horizontal meter */}
                                                        {poseResult?.faceDetected && !capturedFaces[currentPhase.key] && (
                                                            <div className="absolute bottom-14 left-4 right-4 pointer-events-none">
                                                                <div className="bg-black/40 backdrop-blur-sm rounded-xl p-2">
                                                                    <div className="relative h-2 bg-white/20 rounded-full overflow-hidden">
                                                                        {/* Target zone highlight */}
                                                                        <div className="absolute h-full bg-emerald-400/40 rounded-full"
                                                                            style={{
                                                                                left: `${yawPercent(currentPhase.yawMin)}%`,
                                                                                width: `${yawPercent(currentPhase.yawMax) - yawPercent(currentPhase.yawMin)}%`,
                                                                            }} />
                                                                        {/* Current position dot */}
                                                                        <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-white transition-all duration-100"
                                                                            style={{
                                                                                left: `calc(${yawPercent(poseResult.yaw)}% - 6px)`,
                                                                                background: ovalColor,
                                                                            }} />
                                                                    </div>
                                                                    <p className="text-white text-[10px] font-bold text-center mt-1 opacity-80">
                                                                        {currentPhase.dirIcon === "left" ? "← " : ""}{poseLabel(poseResult)}{currentPhase.dirIcon === "right" ? " →" : ""}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Direction arrow overlay */}
                                                        {currentPhase.dirIcon && !capturedFaces[currentPhase.key] && countdown === 0 && !(poseResult?.angleOk) && (
                                                            <div className="absolute inset-0 flex items-center pointer-events-none"
                                                                style={{ justifyContent: currentPhase.dirIcon === "left" ? "flex-end" : "flex-start" }}>
                                                                <div className="flex flex-col gap-1 px-3 py-4 opacity-80">
                                                                    {[0,1,2].map(i => (
                                                                        <div key={i} className="text-white font-black text-xl"
                                                                            style={{ animationName:"arrowPulse", animationDuration:"0.8s", animationDelay:`${i*0.15}s`, animationIterationCount:"infinite", animationTimingFunction:"ease-in-out", opacity:0 }}>
                                                                            {currentPhase.dirIcon === "left" ? "◀" : "▶"}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Countdown */}
                                                        {countdown > 0 && (
                                                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                                <div className="flex flex-col items-center gap-2">
                                                                    {autoCapturing && <p className="text-white text-xs font-bold bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm">Держите лицо</p>}
                                                                    <span className="font-black text-white drop-shadow-2xl" style={{ fontSize:"5rem", lineHeight:1, textShadow:"0 0 20px rgba(0,0,0,0.8)" }}>{countdown}</span>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Captured flash */}
                                                        {countdown === 0 && capturedFaces[currentPhase.key] && (
                                                            <div className="absolute inset-0 flex items-center justify-center bg-white/20 pointer-events-none">
                                                                <div className="text-5xl">✅</div>
                                                            </div>
                                                        )}

                                                        {/* Top instruction */}
                                                        <div className="absolute top-3 left-0 right-0 flex justify-center pointer-events-none">
                                                            <div className="bg-black/50 backdrop-blur-sm text-white text-xs font-bold px-4 py-2 rounded-full">
                                                                {capturedFaces[currentPhase.key] ? "✓ Фото сделано!" : currentPhase.label}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Status panel */}
                                                    {poseResult && !capturedFaces[currentPhase.key] && (
                                                        <div className="rounded-2xl p-3 border transition-all space-y-2"
                                                            style={{ background: poseResult.angleOk ? "#f0fdf4" : "#f8fafc", borderColor: ovalColor + "60" }}>
                                                            <div className="grid grid-cols-3 gap-1.5">
                                                                {[
                                                                    { ok: poseResult.faceDetected, label: "Лицо найдено" },
                                                                    { ok: poseResult.lightingOk,   label: "Освещение хорошее" },
                                                                    { ok: poseResult.angleOk,      label: "Правильный угол" },
                                                                ].map(({ ok, label }) => (
                                                                    <div key={label} className={`flex items-center gap-1 px-2 py-1.5 rounded-xl text-[10px] font-bold ${ok ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"}`}>
                                                                        <span>{ok ? "✓" : "○"}</span><span>{label}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                            {poseResult.angleOk && countdown === 0 && (
                                                                <p className="text-[10px] text-center font-bold text-violet-600 animate-pulse">Автосъёмка — не двигайтесь...</p>
                                                            )}
                                                        </div>
                                                    )}

                                                    {!poseResult && !capturedFaces[currentPhase.key] && (
                                                        <div className="bg-violet-50 border border-violet-200 rounded-2xl p-3 text-center">
                                                            <p className="text-xs font-bold text-violet-600">{currentPhase.hint}</p>
                                                        </div>
                                                    )}
                                                </>
                                            )}

                                            {/* Thumbnail previews */}
                                            <div className="flex gap-2">
                                                {FACE_PHASES.map((p, i) => (
                                                    <div key={p.key} className={`flex-1 rounded-xl overflow-hidden border-2 transition-all ${capturedFaces[p.key] ? "border-emerald-400" : i === facePhaseIdx ? "border-violet-300" : "border-slate-200"}`} style={{ aspectRatio:"4/3" }}>
                                                        {capturedFaces[p.key]
                                                            ? <img src={capturedFaces[p.key]} alt={p.key} className="w-full h-full object-cover" />
                                                            : <div className={`w-full h-full flex flex-col items-center justify-center gap-1 ${i === facePhaseIdx ? "bg-violet-50" : "bg-slate-50"}`}>
                                                                <span className="text-lg">{i === facePhaseIdx ? "📷" : "⬜"}</span>
                                                                <span className="text-[9px] font-bold text-slate-400">{p.key === "front" ? "Прямо" : p.key === "left" ? "Влево" : "Вправо"}</span>
                                                              </div>}
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Manual capture button */}
                                            {!allFacesCaptured && !cameraError && countdown === 0 && !capturedFaces[currentPhase.key] && (
                                                <div className="flex gap-2">
                                                    <button onClick={() => { stableRef.current = 0; countdownRunningRef.current = true; setCountdown(3); }}
                                                        className="flex-1 py-3 rounded-2xl font-black text-white"
                                                        style={{ background:"linear-gradient(135deg,#7c3aed,#0ea5e9)" }}>
                                                        📸 Снять вручную
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
                                                <button onClick={() => { stopCamera(); setFormStep(hasExistingProfile ? 1 : 2); setHasExistingProfile(false); }} className="px-5 py-3 bg-slate-100 rounded-2xl font-bold text-sm text-slate-600 hover:bg-slate-200 transition-colors">← Назад</button>
                                                <button onClick={handleSubmit} disabled={submitting || !allFacesCaptured}
                                                    className="flex-1 py-3 rounded-2xl font-black text-white disabled:opacity-40 transition-all"
                                                    style={{ background:"linear-gradient(135deg,#7c3aed,#0ea5e9)" }}>
                                                    {submitting ? (facesUploading ? "Загрузка..." : "Отправка...") : "Отправить ✓"}
                                                </button>
                                            </div>
                                            </> /* end camPermission === "granted" */}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ── DONE ── */}
                            {modalView === "done" && (
                                <div className="text-center py-8">
                                    <div className="text-6xl mb-4">🎉</div>
                                    <h3 className="text-xl font-black text-slate-800 mb-2">Заявка отправлена!</h3>
                                    <p className="text-sm text-slate-500 leading-relaxed mb-6">Администратор проверит ваши данные и фото. Ответ придёт на <span className="font-bold text-slate-700">{userEmail}</span> адрес:</p>
                                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-left mb-6">
                                        <p className="text-xs font-black text-amber-600 uppercase tracking-wider mb-2">Следующие шаги:</p>
                                        <ul className="text-sm text-amber-700 font-semibold space-y-1.5">
                                            <li className="flex gap-2"><span>1.</span> Администратор проверит ваши данные</li>
                                            <li className="flex gap-2"><span>2.</span> Будет проверена ваша справка из школы и фото лица</li>
                                            <li className="flex gap-2"><span>3.</span> Вы получите уведомление о подтверждении</li>
                                        </ul>
                                    </div>
                                    <button onClick={closeModal} className="w-full py-4 rounded-2xl font-black text-white" style={{ background:"linear-gradient(135deg,#7c3aed,#0ea5e9)" }}>Закрыть</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes arrowPulse {
                    0%   { opacity:0; transform:scale(0.7); }
                    50%  { opacity:1; transform:scale(1.1); }
                    100% { opacity:0; transform:scale(0.7); }
                }
            `}</style>
        </main>
    );
}
