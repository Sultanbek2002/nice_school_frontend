"use client";
import React, { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { GO_API_URL, fixImageUrl } from "@/utils/apiData";
import { gameKind, gameTypeLabel, safeExternalUrl } from "@/utils/games";

interface Game {
  ID: number;
  title: string;
  description: string;
  instructions: string;
  thumbnail: string;
  game_type: string;
  file_url: string;
  file_name?: string;
  file_size?: number;
  external_url: string;
  developer_name: string;
  developer_avatar: string;
  CreatedAt: string;
}

const GAMEQUIZ_CARD = {
  id: "gamequiz",
  thumbnail: "",
  game_type: "WebGL",
  developer_name: "NICE School",
  developer_avatar: "",
  href: "/gamequiz",
  date: "2024-01-01",
};

function formatDate(d: string, locale: string) {
  try {
    return new Date(d).toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" });
  } catch { return ""; }
}

const ACTION_BUTTON =
  "mt-auto w-full py-3 bg-teal-500 hover:bg-teal-600 text-white rounded-2xl font-bold text-sm text-center transition-colors shadow-md shadow-teal-100 active:scale-95 duration-150 flex items-center justify-center gap-2";

// The card's main button does the game's action right away: open the player
// page, go to the external site, or download the file. The cover and title
// always lead to the game's own page with the description and instructions.
function GameAction({ game, href }: { game: any; href: string }) {
  const t = useTranslations("Games");
  const kind = gameKind(game.game_type);
  if (kind === "link") {
    const url = safeExternalUrl(game.external_url);
    if (url) {
      return (
        <a href={url} target="_blank" rel="noopener noreferrer" className={ACTION_BUTTON}>
          <Icon icon="solar:link-round-angle-bold" width={18} />
          {t("openGame")}
          <span aria-hidden>↗</span>
        </a>
      );
    }
  } else if (kind === "download" && game.file_url) {
    return (
      <a href={fixImageUrl(game.file_url, "")} download={game.file_name || true} className={ACTION_BUTTON}>
        <Icon icon="solar:download-minimalistic-bold" width={18} />
        {t("download")}
      </a>
    );
  }
  return (
    <Link href={href} className={ACTION_BUTTON}>
      <span>▶</span>
      {kind === "play" ? t("play") : t("details")}
    </Link>
  );
}

function GameCard({ game, href }: { game: any; href: string }) {
  const t = useTranslations("Games");
  const locale = useLocale();
  return (
    <div className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group flex flex-col">
      <Link href={href} className="relative block h-52 bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden">
        {game.thumbnail ? (
          <img src={fixImageUrl(game.thumbnail, '')} alt={game.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-7xl opacity-30">🎮</div>
          </div>
        )}
        <span className="absolute top-3 left-3 bg-black/70 backdrop-blur-sm text-white text-[11px] font-bold px-2.5 py-1 rounded-full tracking-wider">
          {gameTypeLabel(game.game_type, t)}
        </span>
        {game.developer_avatar ? (
          <img src={fixImageUrl(game.developer_avatar, '')} alt={game.developer_name} className="absolute bottom-3 right-3 w-10 h-10 rounded-full border-2 border-white shadow-lg object-cover" />
        ) : (
          <div className="absolute bottom-3 right-3 w-10 h-10 rounded-full border-2 border-white shadow-lg bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center">
            <span className="text-white text-sm font-bold">{(game.developer_name || "N").charAt(0).toUpperCase()}</span>
          </div>
        )}
      </Link>
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs text-slate-400 font-medium">{game.developer_name}</span>
          <span className="text-slate-200">·</span>
          <span className="text-xs text-slate-400">{formatDate(game.date || game.CreatedAt, locale)}</span>
        </div>
        <h3 className="font-bold text-slate-800 text-lg leading-snug mb-2 group-hover:text-teal-600 transition-colors">
          <Link href={href}>{game.title}</Link>
        </h3>
        <p className="text-slate-500 text-sm line-clamp-2 mb-4 flex-1">{game.description}</p>
        {game.instructions && (
          <div className="bg-slate-50 rounded-xl p-3 mb-4">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">{t("instructions")}</p>
            <p className="text-xs text-slate-500 line-clamp-3 whitespace-pre-line">{game.instructions}</p>
          </div>
        )}
        <GameAction game={game} href={href} />
      </div>
    </div>
  );
}

export default function GamesPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [search, setSearch] = useState("");
  const locale = useLocale();
  const t = useTranslations("Games");

  useEffect(() => {
    fetch(`${GO_API_URL}/api/games?lang=${locale}`)
      .then(r => r.ok ? r.json() : [])
      .then(data => setGames(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [locale]);

  const gamequizCard = {
    ...GAMEQUIZ_CARD,
    title: t("gamequizTitle"),
    description: t("gamequizDescription"),
    instructions: t("gamequizInstructions"),
  };
  const allGames = [gamequizCard, ...games];
  const q = search.trim().toLowerCase();
  const filtered = q
    ? allGames.filter(g =>
        g.title.toLowerCase().includes(q) ||
        g.description.toLowerCase().includes(q) ||
        gameTypeLabel(g.game_type, t).toLowerCase().includes(q) ||
        g.developer_name.toLowerCase().includes(q)
      )
    : allGames;

  return (
    <main className="min-h-screen pt-28 pb-16 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-black text-slate-800 mb-2">{t("title")}</h1>
          <p className="text-slate-500 text-lg">{t("subtitle")}</p>
          <div className="w-16 h-1 bg-teal-500 mt-3 rounded-full" />
        </div>

        {/* Search */}
        <div className="relative max-w-md mb-8">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Icon icon="solar:magnifer-bold" className="text-slate-400" width={18} />
          </div>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="w-full pl-11 pr-10 py-3 rounded-2xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-400 placeholder:text-slate-300 shadow-sm"
            suppressHydrationWarning
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
            >
              <Icon icon="solar:close-circle-bold" width={18} />
            </button>
          )}
        </div>

        {/* Games grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🎮</div>
            <p className="text-slate-400 text-lg font-medium">{t("nothingFound", { query: search })}</p>
            <p className="text-slate-300 text-sm mt-1">{t("tryAnother")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((game: any) => (
              <GameCard
                key={game.id ?? game.ID}
                game={game}
                href={game.href ?? `/games/${game.ID}`}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
