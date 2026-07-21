"use client";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { GAME_WS_URL, GO_API_URL } from "@/utils/apiData";

interface Session {
  ID: number;
  display_name: string;
  character_emoji: string;
  character_color: string;
  score: number;
}

interface Character {
  emoji: string;
  color: string;
}

interface LiveTest {
  ID: number;
  title: string;
  status: string;
  owner_id: number;
}

const FLOAT_ANIMS = ["animate-float-1", "animate-float-2", "animate-float-3", "animate-float-4"];

// Generate or retrieve a stable anonymous user id stored in sessionStorage
function getAnonUserID(): number {
  const key = "lt_anon_uid";
  const stored = sessionStorage.getItem(key);
  if (stored) return parseInt(stored, 10);
  // large random number that won't conflict with real user IDs (real IDs are small ints)
  const id = Math.floor(Math.random() * 9_000_000) + 1_000_000;
  sessionStorage.setItem(key, String(id));
  return id;
}

export default function LobbyPage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const wsRef = useRef<WebSocket | null>(null);

  const [test, setTest] = useState<LiveTest | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [picked, setPicked] = useState<Character | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [joined, setJoined] = useState(false);
  const [myUserID, setMyUserID] = useState(0);
  const [isOwner, setIsOwner] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"name" | "lobby">("name");

  // Try to get user info from token (optional — anonymous join is allowed)
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
    // Anonymous: assign a temporary numeric ID
    setMyUserID(getAnonUserID());
  }, []);

  // Load characters
  useEffect(() => {
    fetch(`${GO_API_URL}/api/live-test/characters`)
      .then((r) => r.json())
      .then((data) => {
        setCharacters(data);
        if (data.length > 0) {
          setPicked(data[Math.floor(Math.random() * data.length)]);
        }
      })
      .catch(() => {});
  }, []);

  // Cleanup WS on unmount
  useEffect(() => {
    return () => { wsRef.current?.close(); };
  }, []);

  const connect = () => {
    if (!displayName.trim() || !picked) {
      setError("Атыңызды жана персонажыңызды тандаңыз");
      return;
    }
    if (!myUserID) return;
    setError("");
    setStep("lobby");

    const ws = new WebSocket(`${GAME_WS_URL}/api/live-test/${code}/ws`);
    wsRef.current = ws;
    (window as any).__ltWs = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({
        type: "join",
        data: {
          display_name: displayName,
          character_emoji: picked!.emoji,
          character_color: picked!.color,
          user_id: myUserID,
        },
      }));
    };

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === "lobby") {
          setTest(msg.data.test);
          setSessions(msg.data.sessions || []);
          setJoined(true);
          if (msg.data.test && myUserID && msg.data.test.owner_id === myUserID) {
            setIsOwner(true);
          }
        } else if (msg.type === "question") {
          sessionStorage.setItem(`lt_q_${code}`, JSON.stringify(msg.data));
          router.push(`/test/${code}/play`);
        } else if (msg.type === "cancelled") {
          router.push("/test");
        } else if (msg.type === "error") {
          setError(msg.data?.message || "Ката");
          setStep("name");
        }
      } catch {}
    };

    ws.onerror = () => {
      setError("Байланыш катасы. Интернетти же кодду текшериңиз.");
      setStep("name");
    };
  };

  const startTest = () => {
    wsRef.current?.send(JSON.stringify({ type: "start" }));
  };

  if (step === "name") {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-slate-gray px-4 py-6">
        <div className="glass-card w-full max-w-md rounded-2xl p-5 sm:p-8">
          <div className="mb-2 text-center text-4xl">🎮</div>
          <h1 className="mb-1 text-center text-xl font-extrabold text-midnight_text">
            Тестке кирүү
          </h1>
          <p className="mb-5 text-center text-sm text-grey">
            Код:{" "}
            <span className="font-mono font-bold tracking-widest text-primary">{code}</span>
          </p>

          {error && (
            <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</div>
          )}

          <label className="mb-1 block text-sm font-semibold text-midnight_text">Атыңыз</label>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && connect()}
            className="mb-4 w-full rounded-xl border border-black/10 bg-white/80 px-3 py-3 text-midnight_text focus:border-primary focus:outline-none"
            maxLength={30}
            placeholder="Атыңызды жазыңыз"
          />

          <label className="mb-2 block text-sm font-semibold text-midnight_text">
            Персонажыңызды тандаңыз
          </label>
          <div className="mb-5 grid max-h-44 grid-cols-4 gap-2 overflow-y-auto pr-1 sm:grid-cols-5">
            {characters.map((ch, i) => (
              <button
                key={i}
                onClick={() => setPicked(ch)}
                className="rounded-xl border-2 py-2 text-2xl transition-all active:scale-95"
                style={{
                  background:
                    picked?.emoji === ch.emoji && picked?.color === ch.color
                      ? ch.color + "33"
                      : undefined,
                  borderColor:
                    picked?.emoji === ch.emoji && picked?.color === ch.color
                      ? ch.color
                      : "transparent",
                }}
              >
                {ch.emoji}
              </button>
            ))}
          </div>

          <button
            onClick={connect}
            disabled={!displayName.trim() || !picked || !myUserID}
            className="w-full rounded-xl bg-primary py-3 font-bold text-white disabled:opacity-50 active:scale-95 transition-all"
          >
            Кирүү →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-900 to-primary px-4 py-8">
      {/* Floating background characters */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {sessions.map((s, i) => (
          <div
            key={s.ID}
            className={`absolute text-5xl opacity-20 ${FLOAT_ANIMS[i % FLOAT_ANIMS.length]}`}
            style={{
              left: `${(i * 17 + 10) % 85}%`,
              top: `${(i * 23 + 5) % 80}%`,
            }}
          >
            {s.character_emoji}
          </div>
        ))}
      </div>

      <div className="relative mx-auto max-w-2xl text-center">
        {/* Code display */}
        <div className="mb-6">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-white/60">
            Кирүү коду
          </p>
          <div className="inline-block rounded-2xl bg-white/10 px-6 py-3 backdrop-blur-sm sm:px-8 sm:py-4">
            <span className="font-mono text-3xl font-extrabold tracking-[0.25em] text-white sm:text-5xl">
              {code}
            </span>
          </div>
        </div>

        <h1 className="mb-2 text-xl font-extrabold text-white sm:text-2xl">
          {test?.title || "Жүктөлүүдө..."}
        </h1>
        <p className="mb-6 text-sm text-white/60">
          {joined ? `${sessions.length} катышуучу кошулду` : "Кошулуп жатат..."}
        </p>

        {/* Players grid */}
        <div className="mb-8 flex flex-wrap justify-center gap-3">
          {sessions.map((s) => (
            <div
              key={s.ID}
              className="flex items-center gap-2 rounded-xl px-3 py-2"
              style={{
                background: s.character_color + "33",
                border: `2px solid ${s.character_color}55`,
              }}
            >
              <span className="text-2xl">{s.character_emoji}</span>
              <span className="text-sm font-semibold text-white">{s.display_name}</span>
            </div>
          ))}
          {sessions.length === 0 && (
            <p className="text-sm text-white/40">Катышуучулар күтүлүүдө...</p>
          )}
        </div>

        {isOwner ? (
          <button
            onClick={startTest}
            disabled={sessions.length === 0}
            className="rounded-2xl bg-white px-10 py-4 text-lg font-extrabold text-primary shadow-lg transition-all hover:scale-105 disabled:opacity-50"
          >
            🚀 Тестти баштоо ({sessions.length})
          </button>
        ) : (
          <div className="rounded-2xl bg-white/10 px-6 py-4 text-white/80 backdrop-blur-sm">
            <div className="mb-1 text-2xl">{picked?.emoji}</div>
            <p className="text-sm">Мугалим тестти баштаганын күтүп жатасыз...</p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes float1 { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-20px) rotate(5deg)} }
        @keyframes float2 { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-15px) rotate(-5deg)} }
        @keyframes float3 { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-25px) rotate(3deg)} }
        @keyframes float4 { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-18px) rotate(-3deg)} }
        .animate-float-1 { animation: float1 3s ease-in-out infinite; }
        .animate-float-2 { animation: float2 4s ease-in-out infinite; }
        .animate-float-3 { animation: float3 3.5s ease-in-out infinite; }
        .animate-float-4 { animation: float4 4.5s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
