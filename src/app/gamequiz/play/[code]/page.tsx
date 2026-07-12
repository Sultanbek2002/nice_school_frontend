"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import {
  useGameSocket,
  ServerMessage,
  PlayerSummary,
  TeamSnapshot,
  QuestionPayload,
} from "@/app/components/GameQuiz/useGameSocket";
import ShipTrack from "@/app/components/GameQuiz/ShipTrack";
import QuestionCard from "@/app/components/GameQuiz/QuestionCard";
import TimerBadge from "@/app/components/GameQuiz/TimerBadge";

type Phase = "waiting" | "playing" | "finished";

export default function PlayGamePage() {
  const params = useParams<{ code: string }>();
  const code = params.code;
  const searchParams = useSearchParams();
  const name = searchParams.get("name") || "Игрок";
  const avatar = searchParams.get("avatar") || "🧑‍🚀";

  const [players, setPlayers] = useState<PlayerSummary[]>([]);
  const [phase, setPhase] = useState<Phase>("waiting");
  const [teams, setTeams] = useState<TeamSnapshot[]>([]);
  const [question, setQuestion] = useState<QuestionPayload | null>(null);
  const [lastResult, setLastResult] = useState<{ correct_answer: string } | null>(null);
  const [winnerId, setWinnerId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const joinedRef = useRef(false);

  const onMessage = useCallback(
    (msg: ServerMessage) => {
      switch (msg.type) {
        case "room_state":
          setPlayers(msg.payload.players);
          break;
        case "game_started":
          setTeams(msg.payload.teams);
          setPhase("playing");
          break;
        case "question":
          setQuestion(msg.payload);
          setLastResult(null);
          break;
        case "question_result":
          setTeams(msg.payload.teams);
          setLastResult({ correct_answer: msg.payload.correct_answer });
          setQuestion(null);
          break;
        case "game_over":
          setTeams(msg.payload.teams);
          setWinnerId(msg.payload.winner_team_id);
          setPhase("finished");
          setQuestion(null);
          break;
        case "error":
          setError(msg.payload.message);
          break;
      }
    },
    []
  );

  const { connected, send } = useGameSocket(code, onMessage);

  useEffect(() => {
    if (connected && !joinedRef.current) {
      joinedRef.current = true;
      send("player_join", { display_name: name, avatar });
    }
  }, [connected, name, avatar, send]);

  const submitAnswer = (answer: string) => send("submit_answer", { answer });

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-gray px-4 text-center">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  const myTeam = teams.find((t) => t.members.some((m) => m.display_name === name));

  return (
    <div className="flex min-h-screen flex-col items-center bg-slate-gray px-4 py-10">
      {phase === "waiting" && (
        <div className="glass-card w-full max-w-md rounded-2xl p-6 text-center">
          <div className="mb-2 text-4xl">{avatar}</div>
          <h1 className="mb-1 text-xl font-bold text-midnight_text">{name}, вы в игре!</h1>
          <p className="mb-4 text-grey">Ждём, пока хост начнёт игру…</p>
          <p className="text-sm text-grey">Игроков в комнате: {players.length}</p>
        </div>
      )}

      {phase === "playing" && question && (
        <div className="flex w-full max-w-xl flex-col items-center gap-4">
          <TimerBadge seconds={question.time_limit} resetKey={question.question_id} />
          <QuestionCard question={question} disabled={!question.can_answer} onAnswer={submitAnswer} />
        </div>
      )}

      {phase === "playing" && !question && (
        <div className="w-full max-w-2xl">
          {lastResult && (
            <p className="mb-4 text-center text-grey">
              Правильный ответ был:{" "}
              <span className="font-semibold text-midnight_text">{lastResult.correct_answer}</span>
            </p>
          )}
          <ShipTrack teams={teams} />
        </div>
      )}

      {phase === "finished" && (
        <div className="w-full max-w-2xl text-center">
          <ShipTrack teams={teams} />
          <p className="mt-8 text-2xl font-bold text-primary">
            {myTeam && myTeam.id === winnerId
              ? "🎉 Ваша команда победила!"
              : `🏆 Победила ${teams.find((t) => t.id === winnerId)?.name ?? ""}`}
          </p>
        </div>
      )}
    </div>
  );
}
