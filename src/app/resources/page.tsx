"use client";
import { Icon } from "@iconify/react";
import { useEffect, useRef, useState } from "react";
import { GO_API_URL, fixImageUrl } from "@/utils/apiData";

// uploads проксируются через Next.js (/uploads/* → backend), поэтому BACKEND_DIRECT не нужен

interface Resource {
  ID: number;
  title: string;
  description: string;
  subject: string;
  category: string;
  status: string;
  file_url: string;
  thumbnail: string;
}

const SUBJECTS = [
  "Все",
  "Математика",
  "Физика",
  "Химия",
  "Биология",
  "Кыргызский язык",
  "Русский язык",
  "Английский язык",
  "История",
  "География",
  "Информатика",
  "Другое",
];

const SUBJECT_ICONS: Record<string, string> = {
  "Математика": "solar:calculator-bold-duotone",
  "Физика": "solar:atom-bold-duotone",
  "Химия": "solar:test-tube-bold-duotone",
  "Биология": "solar:leaf-bold-duotone",
  "Кыргызский язык": "solar:book-bold-duotone",
  "Русский язык": "solar:book-2-bold-duotone",
  "Английский язык": "solar:global-bold-duotone",
  "История": "solar:diploma-bold-duotone",
  "География": "solar:map-point-bold-duotone",
  "Информатика": "solar:laptop-bold-duotone",
};

const SUBJECT_COLORS: Record<string, string> = {
  "Математика": "from-violet-500 to-purple-600",
  "Физика": "from-blue-500 to-cyan-600",
  "Химия": "from-orange-500 to-red-500",
  "Биология": "from-green-500 to-emerald-600",
  "Кыргызский язык": "from-pink-500 to-rose-600",
  "Русский язык": "from-indigo-500 to-blue-600",
  "Английский язык": "from-teal-500 to-cyan-600",
  "История": "from-amber-500 to-orange-600",
  "География": "from-lime-500 to-green-600",
  "Информатика": "from-slate-500 to-gray-700",
};

type BoardTool = "pen"|"eraser"|"rect"|"circle"|"line"|"text";

export default function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSubject, setActiveSubject] = useState("Все");
  const [slideOpen, setSlideOpen] = useState<Resource | null>(null);
  const [boardOpen, setBoardOpen] = useState(false);
  const [tool, setTool] = useState<BoardTool>("pen");
  const [brushColor, setBrushColor] = useState("#ffffff");
  const [brushSize, setBrushSize] = useState(3);
  const [bgColor, setBgColor] = useState("#1a1a2e");
  const [fontSize, setFontSize] = useState(64);
  const [textPos, setTextPos] = useState<{cx:number;cy:number;sx:number;sy:number}|null>(null);
  const [textVal, setTextVal] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const startPosRef = useRef({x:0,y:0});
  const lastPosRef = useRef({x:0,y:0});
  const snapshotRef = useRef<ImageData|null>(null);
  const textInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const url =
          activeSubject === "Все"
            ? `${GO_API_URL}/api/resources`
            : `${GO_API_URL}/api/resources?subject=${encodeURIComponent(activeSubject)}`;
        const res = await fetch(url);
        const data = await res.json();
        setResources(Array.isArray(data) ? data : []);
      } catch {
        setResources([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [activeSubject]);

  // Init canvas when board opens
  useEffect(() => {
    if (!boardOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (parent) {
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
    }
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardOpen]);

  const getPos = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const getScreenPos = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const paintShape = (ctx: CanvasRenderingContext2D, t: string, start:{x:number,y:number}, end:{x:number,y:number}) => {
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    if (t === "rect") {
      ctx.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y);
    } else if (t === "circle") {
      const cx = (start.x + end.x) / 2;
      const cy = (start.y + end.y) / 2;
      const rx = Math.abs(end.x - start.x) / 2;
      const ry = Math.abs(end.y - start.y) / 2;
      if (rx > 0 && ry > 0) { ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); ctx.stroke(); }
    } else if (t === "line") {
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
    }
  };

  const startDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (tool === "text") {
      const cp = getPos(e);
      const sp = getScreenPos(e);
      setTextPos({ cx: cp.x, cy: cp.y, sx: sp.x, sy: sp.y });
      setTextVal("");
      setTimeout(() => textInputRef.current?.focus(), 0);
      return;
    }
    isDrawingRef.current = true;
    const pos = getPos(e);
    startPosRef.current = pos;
    lastPosRef.current = pos;
    if (tool !== "pen" && tool !== "eraser") {
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext("2d")!;
      snapshotRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const pos = getPos(e);
    if (tool === "pen" || tool === "eraser") {
      ctx.beginPath();
      ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.strokeStyle = tool === "eraser" ? bgColor : brushColor;
      ctx.lineWidth = tool === "eraser" ? brushSize * 5 : brushSize;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();
      lastPosRef.current = pos;
    } else if (snapshotRef.current) {
      ctx.putImageData(snapshotRef.current, 0, 0);
      paintShape(ctx, tool, startPosRef.current, pos);
    }
  };

  const endDraw = () => { isDrawingRef.current = false; };

  const commitText = () => {
    if (!textPos) return;
    if (textVal.trim()) {
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext("2d")!;
      ctx.font = `bold ${fontSize}px sans-serif`;
      ctx.fillStyle = brushColor;
      ctx.textBaseline = "top";
      ctx.fillText(textVal, textPos.cx, textPos.cy);
    }
    setTextPos(null);
    setTextVal("");
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const changeBg = (color: string) => {
    setBgColor(color);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const closeSlide = () => { setSlideOpen(null); setBoardOpen(false); };

  const COLORS = ["#ffffff","#ffd700","#00ff88","#00d4ff","#ff6eb4","#ff8c42","#ff4444"];
  const SIZES = [2, 4, 8, 16];
  const BG_COLORS = [
    { c:"#1a1a2e", label:"Тёмно-синий" },
    { c:"#0d2818", label:"Зелёный" },
    { c:"#000000", label:"Чёрный" },
    { c:"#1a0033", label:"Тёмно-фиолетовый" },
    { c:"#f5f0e8", label:"Бумага" },
    { c:"#ffffff", label:"Белый" },
  ];
  const FONT_SIZES = [{ s:24,l:"M" },{ s:36,l:"L" },{ s:48,l:"XL" },{ s:64,l:"XXL" }];
  const BOARD_TOOLS: { id: BoardTool; icon: string; label: string }[] = [
    { id:"pen",    icon:"solar:pen-bold",           label:"Карандаш" },
    { id:"rect",   icon:"solar:rectangle-bold",     label:"Прямоугольник" },
    { id:"circle", icon:"solar:circle-bold",         label:"Эллипс" },
    { id:"line",   icon:"solar:minus-bold",          label:"Линия" },
    { id:"text",   icon:"solar:text-bold",           label:"Текст" },
    { id:"eraser", icon:"solar:eraser-bold",         label:"Ластик" },
  ];

  return (
    <main
      className="min-h-screen pb-24"
      style={{
        background:
          "linear-gradient(145deg,#f0f4ff 0%,#faf5ff 35%,#f0fdf4 65%,#fff7ed 100%)",
      }}
    >
      {/* Background decorations */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle,rgba(99,102,241,0.08) 1px,transparent 1px)",
          backgroundSize: "36px 36px",
        }}
      />
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          style={{
            position: "absolute",
            top: "-10%",
            right: "-5%",
            width: "500px",
            height: "500px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle,rgba(167,139,250,0.2) 0%,transparent 70%)",
            filter: "blur(60px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "10%",
            left: "-5%",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle,rgba(6,182,212,0.15) 0%,transparent 70%)",
            filter: "blur(60px)",
          }}
        />
      </div>

      <div className="relative z-10 pt-36 container mx-auto px-4">
        {/* Orbital Hero */}
        <div className="flex flex-col md:flex-row items-center gap-8 mb-14">
          {/* Text side */}
          <div className="flex-1 text-center md:text-left">
            <span
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold mb-5"
              style={{
                color: "#0b6f5d",
                background: "rgba(255,255,255,0.7)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255,255,255,0.8)",
                boxShadow: "0 10px 26px -12px rgba(11,111,93,0.4)",
              }}
            >
              ✦ ЦЕНТР ЗНАНИЙ
            </span>
            <h1
              className="font-black mb-4"
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: "clamp(36px,5vw,64px)",
                lineHeight: 1.04,
                letterSpacing: "-2px",
                background: "linear-gradient(120deg,#0c2440,#0b6f5d 55%,#123a5e)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Углуби<br />свои знания!
            </h1>
            <p className="text-slate-500 text-lg max-w-md" style={{ lineHeight: 1.6 }}>
              Изучай учебные слайды по предметам и повышай свой интеллектуальный уровень.
            </p>
          </div>

          {/* Orbital animation */}
          <div className="flex-shrink-0 relative" style={{ width: 340, height: 340 }}>
            <style>{`
              @keyframes orbit-r1 {
                from { transform: rotate(-90deg) translateX(115px) rotate(90deg); }
                to   { transform: rotate(270deg)  translateX(115px) rotate(-270deg); }
              }
              @keyframes orbit-r2 {
                from { transform: rotate(0deg)   translateX(165px) rotate(0deg); }
                to   { transform: rotate(-360deg) translateX(165px) rotate(360deg); }
              }
              .orb-item {
                position: absolute;
                top: 50%; left: 50%;
                width: 52px; height: 52px;
                margin-left: -26px; margin-top: -26px;
                display: flex; align-items: center; justify-content: center;
                font-size: 26px;
              }
            `}</style>

            {/* Center core */}
            <div
              className="absolute rounded-full flex flex-col items-center justify-center text-white font-bold"
              style={{
                width: 120, height: 120,
                top: "50%", left: "50%",
                transform: "translate(-50%,-50%)",
                zIndex: 2,
                background: "radial-gradient(circle at 34% 30%,#4bc4ac,#0b6f5d 60%,#094a3e)",
                boxShadow: "0 30px 60px -15px rgba(11,111,93,0.8), inset 0 3px 0 rgba(255,255,255,0.4)",
                fontFamily: "'Space Grotesk',sans-serif",
                lineHeight: 1.25,
                textAlign: "center",
              }}
            >
              <span style={{ fontSize: 13 }}>NICE</span>
              <span style={{ fontSize: 11, opacity: 0.85 }}>Ресурсы</span>
            </div>

            {/* Ring 1 — dashed */}
            <div className="absolute rounded-full" style={{
              width: 230, height: 230,
              top: "50%", left: "50%",
              transform: "translate(-50%,-50%)",
              border: "2px dashed rgba(11,111,93,0.3)",
            }} />
            {/* Ring 2 — dashed */}
            <div className="absolute rounded-full" style={{
              width: 330, height: 330,
              top: "50%", left: "50%",
              transform: "translate(-50%,-50%)",
              border: "2px dashed rgba(18,58,94,0.2)",
            }} />

            {/* Ring 1 items — orbit clockwise, 3 items × 120° */}
            <div className="orb-item" style={{
              borderRadius: 14,
              background: "linear-gradient(150deg,#6f96c2,#123a5e)",
              boxShadow: "0 10px 22px -8px rgba(18,58,94,0.7)",
              animation: "orbit-r1 18s linear infinite",
            }}>📐</div>
            <div className="orb-item" style={{
              borderRadius: "50%",
              background: "linear-gradient(150deg,#ffd76a,#ff9d3c)",
              boxShadow: "0 10px 22px -8px rgba(255,157,60,0.7)",
              animation: "orbit-r1 18s linear -6s infinite",
            }}>🏆</div>
            <div className="orb-item" style={{
              borderRadius: 14,
              background: "linear-gradient(150deg,#a78bfa,#7c3aed)",
              boxShadow: "0 10px 22px -8px rgba(124,58,237,0.7)",
              animation: "orbit-r1 18s linear -12s infinite",
            }}>⭐</div>

            {/* Ring 2 items — orbit counter-clockwise, 3 items × 120° */}
            <div className="orb-item" style={{
              borderRadius: 14,
              background: "linear-gradient(150deg,#2aa891,#0b6f5d)",
              boxShadow: "0 10px 22px -8px rgba(11,111,93,0.7)",
              animation: "orbit-r2 26s linear infinite",
            }}>📚</div>
            <div className="orb-item" style={{
              borderRadius: "50%",
              background: "linear-gradient(150deg,#86ddc9,#0e8f77)",
              boxShadow: "0 10px 22px -8px rgba(14,143,119,0.7)",
              animation: "orbit-r2 26s linear -8.67s infinite",
            }}>🔬</div>
            <div className="orb-item" style={{
              borderRadius: 14,
              background: "linear-gradient(150deg,#f9a8d4,#ec4899)",
              boxShadow: "0 10px 22px -8px rgba(236,72,153,0.6)",
              animation: "orbit-r2 26s linear -17.33s infinite",
            }}>🎯</div>
          </div>
        </div>

        {/* Subject filter chips */}
        <div className="flex gap-2 flex-wrap justify-center mb-10">
          {SUBJECTS.map((s) => (
            <button
              key={s}
              onClick={() => setActiveSubject(s)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                activeSubject === s
                  ? "bg-violet-600 text-white shadow-lg shadow-violet-300"
                  : "bg-white/80 text-slate-600 hover:bg-white hover:shadow-md border border-white/60"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center items-center h-48">
            <Icon
              icon="svg-spinners:ring-resize"
              width={40}
              className="text-violet-500"
            />
          </div>
        ) : resources.length === 0 ? (
          <div className="text-center py-20">
            <Icon
              icon="solar:file-search-bold-duotone"
              width={56}
              className="text-slate-300 mx-auto mb-4"
            />
            <p className="text-slate-400 text-lg font-medium">Ресурсы не найдены</p>
            <p className="text-slate-300 text-sm mt-1">
              Выберите другой предмет
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {resources.map((r) => {
              const grad =
                SUBJECT_COLORS[r.subject] || "from-violet-500 to-purple-600";
              const icon =
                SUBJECT_ICONS[r.subject] || "solar:book-bold-duotone";
              return (
                <div
                  key={r.ID}
                  onClick={() => r.file_url && setSlideOpen(r)}
                  className="group bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer overflow-hidden"
                >
                  {/* Card top gradient */}
                  <div
                    className={`h-36 bg-gradient-to-br ${grad} flex items-center justify-center relative overflow-hidden`}
                  >
                    {r.thumbnail ? (
                      <img
                        src={r.thumbnail.startsWith("http") ? fixImageUrl(r.thumbnail) : r.thumbnail}
                        alt={r.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Icon
                        icon={icon}
                        width={56}
                        className="text-white/80 group-hover:scale-110 transition-transform duration-300"
                      />
                    )}
                    {/* Status badge */}
                    <div
                      className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-bold ${
                        r.status === "paid"
                          ? "bg-amber-400 text-amber-900"
                          : "bg-white/90 text-green-700"
                      }`}
                    >
                      {r.status === "paid" ? "Платно" : "Бесплатно"}
                    </div>
                    {/* Play overlay on hover */}
                    {r.file_url && (
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/20">
                        <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                          <Icon
                            icon="solar:play-bold"
                            width={22}
                            className="text-violet-600 ml-0.5"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card body */}
                  <div className="p-4">
                    <h3 className="font-bold text-slate-800 text-sm leading-snug mb-2 line-clamp-2 group-hover:text-violet-700 transition-colors">
                      {r.title}
                    </h3>
                    {r.description && (
                      <p className="text-slate-500 text-xs line-clamp-2 mb-3">
                        {r.description}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-1.5 mt-auto">
                      {r.subject && (
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r ${grad}`}
                        >
                          <Icon icon={icon} width={11} />
                          {r.subject}
                        </span>
                      )}
                      {r.category && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                          {r.category}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Slide viewer modal */}
      {slideOpen && (
        <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "#0d0d1a" }}>
          {/* Header bar */}
          <div className="flex items-center justify-between px-4 py-2.5 flex-shrink-0 border-b border-white/10" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(12px)" }}>
            <div className="flex items-center gap-3">
              <button
                onClick={closeSlide}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <Icon icon="solar:arrow-left-bold" width={20} />
              </button>
              <div>
                <h2 className="text-white font-bold text-sm line-clamp-1">{slideOpen.title}</h2>
                <div className="flex gap-2 mt-0.5">
                  {slideOpen.subject && <span className="text-white/60 text-xs">{slideOpen.subject}</span>}
                  {slideOpen.category && <span className="text-white/40 text-xs">• {slideOpen.category}</span>}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Board toggle */}
              <button
                onClick={() => setBoardOpen((v) => !v)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  boardOpen
                    ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/40"
                    : "bg-white/10 hover:bg-white/20 text-white"
                }`}
              >
                <Icon icon="solar:pen-new-square-bold" width={14} />
                Доска
              </button>
              {/* Fullscreen */}
              <a
                href={slideOpen.file_url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold transition-colors"
              >
                <Icon icon="solar:maximize-square-bold" width={14} />
                Толук экран
              </a>
            </div>
          </div>

          {/* Content area */}
          <div className="flex-1 overflow-hidden flex">
            {/* Slide iframe */}
            <div className={`h-full transition-all duration-300 ${boardOpen ? "w-[55%]" : "w-full"}`}>
              <iframe
                src={slideOpen.file_url}
                className="w-full h-full border-0"
                title={slideOpen.title}
                sandbox="allow-scripts allow-same-origin"
              />
            </div>

            {/* Whiteboard panel */}
            {boardOpen && (
              <div className="w-[45%] h-full flex flex-col border-l border-white/10" style={{ background: "#0f1020" }}>
                {/* Row 1 — Tools + Stroke colors */}
                <div className="flex items-center gap-1 px-2 py-2 flex-shrink-0 border-b border-white/10 flex-wrap" style={{ background: "rgba(0,0,0,0.45)" }}>
                  {BOARD_TOOLS.map((t) => (
                    <button
                      key={t.id}
                      title={t.label}
                      onClick={() => setTool(t.id)}
                      className={`flex items-center justify-center w-8 h-8 rounded-lg transition-colors ${
                        tool === t.id ? "bg-white/20 text-white shadow-inner" : "text-white/45 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <Icon icon={t.icon} width={16} />
                    </button>
                  ))}
                  <div className="w-px h-5 bg-white/15 mx-1" />
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      title={c}
                      onClick={() => { setBrushColor(c); if (tool === "eraser") setTool("pen"); }}
                      className="rounded-full flex-shrink-0 transition-transform hover:scale-110"
                      style={{
                        width: 19, height: 19,
                        background: c,
                        border: brushColor === c && tool !== "eraser" ? "2.5px solid #fff" : "2px solid rgba(255,255,255,0.18)",
                        transform: brushColor === c && tool !== "eraser" ? "scale(1.25)" : undefined,
                        boxShadow: brushColor === c && tool !== "eraser" ? "0 0 0 1px rgba(255,255,255,0.4)" : undefined,
                      }}
                    />
                  ))}
                </div>

                {/* Row 2 — Size + BG + FontSize + Clear */}
                <div className="flex items-center gap-1 px-2 py-1.5 flex-shrink-0 border-b border-white/10 flex-wrap" style={{ background: "rgba(0,0,0,0.3)" }}>
                  <span className="text-white/35 text-xs mr-0.5">Размер</span>
                  {SIZES.map((s) => (
                    <button
                      key={s}
                      onClick={() => setBrushSize(s)}
                      className="flex items-center justify-center w-7 h-7 rounded-lg transition-colors"
                      style={{ background: brushSize === s ? "rgba(255,255,255,0.18)" : "transparent" }}
                    >
                      <div className="rounded-full bg-white" style={{ width: Math.min(s + 2, 16), height: Math.min(s + 2, 16) }} />
                    </button>
                  ))}

                  <div className="w-px h-4 bg-white/15 mx-1.5" />

                  <span className="text-white/35 text-xs mr-0.5">Фон</span>
                  {BG_COLORS.map(({ c, label }) => (
                    <button
                      key={c}
                      title={label}
                      onClick={() => changeBg(c)}
                      className="rounded flex-shrink-0 transition-transform hover:scale-110"
                      style={{
                        width: 19, height: 19,
                        background: c,
                        border: bgColor === c ? "2.5px solid #60a5fa" : "1.5px solid rgba(255,255,255,0.25)",
                      }}
                    />
                  ))}

                  {tool === "text" && (
                    <>
                      <div className="w-px h-4 bg-white/15 mx-1.5" />
                      <span className="text-white/35 text-xs mr-0.5">Текст</span>
                      {FONT_SIZES.map(({ s, l }) => (
                        <button
                          key={s}
                          onClick={() => setFontSize(s)}
                          className={`px-1.5 py-0.5 rounded text-xs font-bold transition-colors ${
                            fontSize === s ? "bg-white/20 text-white" : "text-white/45 hover:bg-white/10 hover:text-white"
                          }`}
                        >
                          {l}
                        </button>
                      ))}
                    </>
                  )}

                  <button
                    onClick={clearCanvas}
                    title="Очистить"
                    className="ml-auto flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-white/45 hover:bg-red-500/20 hover:text-red-400 transition-colors"
                  >
                    <Icon icon="solar:trash-bin-minimalistic-bold" width={13} />
                    Очистить
                  </button>
                </div>

                {/* Canvas */}
                <div className="flex-1 overflow-hidden relative">
                  <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full"
                    style={{
                      cursor: tool === "eraser" ? "cell" : tool === "text" ? "text" : "crosshair",
                      touchAction: "none",
                    }}
                    onMouseDown={startDraw}
                    onMouseMove={draw}
                    onMouseUp={endDraw}
                    onMouseLeave={endDraw}
                    onTouchStart={startDraw}
                    onTouchMove={draw}
                    onTouchEnd={endDraw}
                  />
                  {/* Text input overlay */}
                  {textPos && (
                    <div
                      style={{
                        position: "absolute",
                        left: Math.min(textPos.sx, (canvasRef.current?.offsetWidth ?? 600) - 260),
                        top: Math.max(0, textPos.sy - 4),
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        zIndex: 10,
                      }}
                    >
                      <input
                        ref={textInputRef}
                        value={textVal}
                        onChange={(e) => setTextVal(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") { e.preventDefault(); commitText(); }
                          if (e.key === "Escape") { setTextPos(null); setTextVal(""); }
                        }}
                        autoFocus
                        placeholder="Введите текст…"
                        style={{
                          fontSize: Math.min(fontSize, 48),
                          fontWeight: "bold",
                          fontFamily: "sans-serif",
                          color: brushColor,
                          background: "rgba(0,0,0,0.55)",
                          border: "1.5px dashed rgba(255,255,255,0.5)",
                          borderRadius: 6,
                          outline: "none",
                          padding: "4px 10px",
                          minWidth: 120,
                          maxWidth: 340,
                          caretColor: brushColor,
                          lineHeight: 1.2,
                          backdropFilter: "blur(4px)",
                        }}
                      />
                      <button
                        onMouseDown={(e) => { e.preventDefault(); commitText(); }}
                        style={{
                          width: 36, height: 36,
                          borderRadius: 8,
                          background: "#10b981",
                          border: "none",
                          color: "#fff",
                          fontSize: 18,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          boxShadow: "0 4px 12px rgba(16,185,129,0.5)",
                        }}
                      >✓</button>
                      <button
                        onMouseDown={(e) => { e.preventDefault(); setTextPos(null); setTextVal(""); }}
                        style={{
                          width: 36, height: 36,
                          borderRadius: 8,
                          background: "rgba(255,255,255,0.1)",
                          border: "none",
                          color: "rgba(255,255,255,0.6)",
                          fontSize: 16,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >✕</button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
