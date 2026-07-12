"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GO_API_URL } from "@/utils/apiData";

interface QuizOption {
  ID: number;
  title: string;
  description: string;
  question_count: number;
}

export default function GameQuizHomePage() {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<QuizOption[]>([]);
  const [quizId, setQuizId] = useState<number | null>(null);
  const [teamCount, setTeamCount] = useState(2);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${GO_API_URL}/api/gamequizzes/published`)
      .then((r) => r.json())
      .then((data: QuizOption[]) => {
        setQuizzes(data || []);
        if (data?.length) setQuizId(data[0].ID);
      })
      .catch(() => setError("Не удалось загрузить список квизов"));
  }, []);

  const createRoom = async () => {
    if (!quizId) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${GO_API_URL}/api/gamequiz/rooms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quiz_id: quizId, team_count: teamCount }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка создания игры");
      sessionStorage.setItem(`gamequiz_host_token_${data.room_code}`, data.host_token);
      router.push(`/gamequiz/host/${data.room_code}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка создания игры");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-gray px-4">
      <div className="glass-card w-full max-w-md rounded-2xl p-8">
        <h1 className="mb-1 text-2xl font-bold text-midnight_text">Гонка кораблей</h1>
        <p className="mb-6 text-grey">Создайте игру и пригласите игроков по коду</p>

        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

        <label className="mb-1 block text-sm font-medium text-midnight_text">Квиз</label>
        <select
          className="mb-4 w-full rounded-xl border border-black/10 px-3 py-2"
          value={quizId ?? ""}
          onChange={(e) => setQuizId(Number(e.target.value))}
        >
          {quizzes.length === 0 && <option value="">Нет доступных квизов</option>}
          {quizzes.map((q) => (
            <option key={q.ID} value={q.ID}>
              {q.title} ({q.question_count} вопросов)
            </option>
          ))}
        </select>

        <label className="mb-1 block text-sm font-medium text-midnight_text">Число команд</label>
        <select
          className="mb-6 w-full rounded-xl border border-black/10 px-3 py-2"
          value={teamCount}
          onChange={(e) => setTeamCount(Number(e.target.value))}
        >
          {[2, 3, 4, 5, 6].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>

        <button
          onClick={createRoom}
          disabled={!quizId || loading}
          className="w-full rounded-xl bg-primary py-3 font-semibold text-white disabled:opacity-50"
        >
          {loading ? "Создаём…" : "Создать игру"}
        </button>

        <p className="mt-6 text-center text-sm text-grey">
          Уже есть код?{" "}
          <a href="/gamequiz/join" className="font-medium text-primary">
            Присоединиться
          </a>
        </p>
      </div>
    </div>
  );
}
