"use client";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  useGameSocket,
  ServerMessage,
  PlayerSummary,
  TeamSnapshot,
} from "@/app/components/GameQuiz/useGameSocket";
import ShipTrack from "@/app/components/GameQuiz/ShipTrack";

export default function HostRoomPage() {
  const params = useParams<{ code: string }>();
  const code = params.code;

  const [hostToken, setHostToken] = useState<string | null>(null);
  const [players, setPlayers] = useState<PlayerSummary[]>([]);
  const [phase, setPhase] = useState("waiting");
  const [teams, setTeams] = useState<TeamSnapshot[]>([]);
  const [winnerId, setWinnerId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setHostToken(sessionStorage.getItem(`gamequiz_host_token_${code}`));
  }, [code]);

  const onMessage = useCallback((msg: ServerMessage) => {
    switch (msg.type) {
      case "room_state":
        setPlayers(msg.payload.players);
        setPhase(msg.payload.phase);
        break;
      case "game_started":
        setTeams(msg.payload.teams);
        setPhase("playing");
        break;
      case "question_result":
        setTeams(msg.payload.teams);
        break;
      case "game_over":
        setTeams(msg.payload.teams);
        setWinnerId(msg.payload.winner_team_id);
        setPhase("finished");
        break;
      case "error":
        setError(msg.payload.message);
        break;
    }
  }, []);

  const { connected, send } = useGameSocket(code, onMessage);

  useEffect(() => {
    if (connected && hostToken) {
      send("host_join", { host_token: hostToken });
    }
  }, [connected, hostToken, send]);

  if (!hostToken) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-gray px-4 text-center">
        <p className="text-grey">
          Токен хоста не найден. Создайте игру заново на странице «Гонка кораблей».
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-slate-gray px-4 py-10">
      <h1 className="mb-2 text-3xl font-bold text-midnight_text">Код комнаты</h1>
      <div className="mb-8 text-5xl font-black tracking-[0.3em] text-primary">{code}</div>

      {error && <p className="mb-4 text-red-600">{error}</p>}

      {phase === "waiting" && (
        <div className="glass-card w-full max-w-lg rounded-2xl p-6">
          <h2 className="mb-4 font-semibold text-midnight_text">Игроки ({players.length})</h2>
          <div className="mb-6 flex flex-wrap gap-3">
            {players.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-2 rounded-xl border border-black/10 bg-white px-3 py-2"
              >
                <span className="text-xl">{p.avatar}</span>
                <span className="text-sm font-medium text-midnight_text">{p.display_name}</span>
              </div>
            ))}
            {players.length === 0 && <p className="text-sm text-grey">Ждём игроков…</p>}
          </div>
          <button
            onClick={() => send("host_start_game")}
            disabled={players.length === 0}
            className="w-full rounded-xl bg-primary py-3 font-semibold text-white disabled:opacity-50"
          >
            Начать игру
          </button>
        </div>
      )}

      {(phase === "playing" || phase === "finished") && (
        <div className="w-full max-w-2xl">
          <ShipTrack teams={teams} />
          {phase === "finished" && winnerId && (
            <p className="mt-8 text-center text-xl font-bold text-primary">
              🏆 Победила {teams.find((t) => t.id === winnerId)?.name}!
            </p>
          )}
        </div>
      )}
    </div>
  );
}
