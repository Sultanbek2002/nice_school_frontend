import React from "react";
import Link from "next/link";
import { GO_API_URL } from "@/utils/apiData";

interface Game {
  ID: number;
  title: string;
  description: string;
  instructions: string;
  thumbnail: string;
  game_type: string;
  file_url: string;
  external_url: string;
  developer_name: string;
  developer_avatar: string;
  CreatedAt: string;
}

// Default gamequiz card — always shown
const GAMEQUIZ_CARD = {
  id: "gamequiz",
  title: "Гонка кораблей",
  description: "Командная гонка ответов. Кто быстрее и точнее отвечает — тот впереди!",
  instructions: "1. Нажмите кнопку «Играть»\n2. Получите код команды\n3. Отвечайте на вопросы\n4. Самая быстрая команда побеждает!",
  thumbnail: "",
  game_type: "WebGL",
  developer_name: "NICE School",
  developer_avatar: "",
  href: "/gamequiz",
  date: "2024-01-01",
};

function formatDate(d: string) {
  try {
    return new Date(d).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
  } catch { return ""; }
}

function GameCard({ game, href }: { game: any; href: string }) {
  return (
    <div className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group flex flex-col">
      {/* Thumbnail */}
      <div className="relative h-52 bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden">
        {game.thumbnail ? (
          <img src={game.thumbnail} alt={game.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-7xl opacity-30">🎮</div>
          </div>
        )}

        {/* Format badge */}
        <span className="absolute top-3 left-3 bg-black/70 backdrop-blur-sm text-white text-[11px] font-bold px-2.5 py-1 rounded-full tracking-wider">
          {game.game_type}
        </span>

        {/* Developer avatar */}
        {game.developer_avatar ? (
          <img
            src={game.developer_avatar}
            alt={game.developer_name}
            className="absolute bottom-3 right-3 w-10 h-10 rounded-full border-2 border-white shadow-lg object-cover"
          />
        ) : (
          <div className="absolute bottom-3 right-3 w-10 h-10 rounded-full border-2 border-white shadow-lg bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center">
            <span className="text-white text-sm font-bold">
              {(game.developer_name || "N").charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs text-slate-400 font-medium">{game.developer_name}</span>
          <span className="text-slate-200">·</span>
          <span className="text-xs text-slate-400">{formatDate(game.date || game.CreatedAt)}</span>
        </div>

        <h3 className="font-bold text-slate-800 text-lg leading-snug mb-2 group-hover:text-teal-600 transition-colors">
          {game.title}
        </h3>

        <p className="text-slate-500 text-sm line-clamp-2 mb-4 flex-1">{game.description}</p>

        {/* Instructions preview */}
        {game.instructions && (
          <div className="bg-slate-50 rounded-xl p-3 mb-4">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Инструкция</p>
            <p className="text-xs text-slate-500 line-clamp-3 whitespace-pre-line">{game.instructions}</p>
          </div>
        )}

        <Link
          href={href}
          className="mt-auto w-full py-3 bg-teal-500 hover:bg-teal-600 text-white rounded-2xl font-bold text-sm text-center transition-colors shadow-md shadow-teal-100 active:scale-95 duration-150 flex items-center justify-center gap-2"
        >
          <span>▶</span>
          Играть
        </Link>
      </div>
    </div>
  );
}

export default async function GamesPage() {
  let games: Game[] = [];
  try {
    const res = await fetch(`${GO_API_URL}/api/games`, { cache: "no-store" });
    if (res.ok) games = await res.json();
  } catch {}

  return (
    <main className="min-h-screen pt-28 pb-16 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-black text-slate-800 mb-2">Игры</h1>
          <p className="text-slate-500 text-lg">Образовательные игры и интерактивные задания</p>
          <div className="w-16 h-1 bg-teal-500 mt-3 rounded-full" />
        </div>

        {/* Games grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Default gamequiz card */}
          <GameCard game={GAMEQUIZ_CARD} href="/gamequiz" />

          {/* Dynamic games from backend */}
          {games.map((game) => (
            <GameCard
              key={game.ID}
              game={game}
              href={`/games/${game.ID}`}
            />
          ))}
        </div>

        {games.length === 0 && (
          <p className="text-center text-slate-400 mt-8 text-sm">Скоро появятся новые игры...</p>
        )}
      </div>
    </main>
  );
}
