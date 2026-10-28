import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import GamePlayer from "./GamePlayer";
import { GO_API_URL, fixImageUrl } from "@/utils/apiData";
import { RelatedGameCard, RelatedSectionBlock } from "@/app/components/RelatedSection";
import { pageMetadata, truncate, SITE_NAME } from "@/utils/seo";
import { formatFileSize, gameKind, gameTypeLabel, safeExternalUrl } from "@/utils/games";

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

function formatDate(d: string, locale: string) {
  try {
    return new Date(d).toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" });
  } catch { return ""; }
}

// Заголовок и описание страницы игры для поисковиков и превью в мессенджерах
export async function generateMetadata({ params }: { params: Promise<{ id: string; locale: string }> }): Promise<Metadata> {
  const { id, locale } = await params;
  const t = await getTranslations({ locale, namespace: "Games" });
  try {
    const res = await fetch(`${GO_API_URL}/api/games/${id}?lang=${locale}`, { cache: "no-store" });
    if (res.ok) {
      const g: Game = await res.json();
      const title = g.title.trim();
      return pageMetadata({
        title: t("metaTitle", { title }),
        description: truncate(g.description) || t("metaDescription", { title, site: SITE_NAME }),
        path: `/games/${id}`,
        image: g.thumbnail,
        locale,
      });
    }
  } catch {}
  return pageMetadata({ title: t("metaFallback"), path: `/games/${id}`, noindex: true, locale });
}

export default async function GameDetailPage({ params }: { params: Promise<{ id: string; locale: string }> }) {
  const { id, locale } = await params;
  const t = await getTranslations({ locale, namespace: "Games" });

  let game: Game | null = null;
  let otherGames: Game[] = [];

  try {
    const [gameRes, allGamesRes] = await Promise.all([
      fetch(`${GO_API_URL}/api/games/${id}?lang=${locale}`, { cache: "no-store" }),
      fetch(`${GO_API_URL}/api/games?lang=${locale}`, { cache: "no-store" }),
    ]);
    if (gameRes.ok) game = await gameRes.json();
    if (allGamesRes.ok) {
      const all = await allGamesRes.json();
      otherGames = Array.isArray(all) ? all.filter((g: Game) => g.ID !== Number(id)).slice(0, 3) : [];
    }
  } catch {}

  // Настоящий HTTP 404 (а не «200 + текст ошибки») — иначе Google считает такие адреса мусорными страницами
  if (!game) notFound();

  const kind = gameKind(game.game_type);
  const typeLabel = gameTypeLabel(game.game_type, t);
  const fileSize = formatFileSize(game.file_size, t);
  const actionUrl = kind === "link" ? safeExternalUrl(game.external_url) : fixImageUrl(game.file_url, '');

  return (
    <main className="min-h-screen pt-24 pb-16">
      {/* Game player — full width. Link and download games get a launch panel instead. */}
      <div className="w-full bg-black">
        {kind === "play" ? (
          <GamePlayer
            gameUrl={actionUrl}
            title={game.title}
            gameType={game.game_type}
          />
        ) : (
          <div className="relative w-full min-h-[420px] flex flex-col items-center justify-center text-center px-4 py-16 bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900 overflow-hidden">
            {game.thumbnail && (
              <img src={fixImageUrl(game.thumbnail, '')} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover opacity-20 blur-sm" />
            )}
            <div className="relative">
              <div className="text-6xl mb-4">{kind === "link" ? "🔗" : "📦"}</div>
              <h2 className="text-white text-2xl md:text-3xl font-black mb-2">{game.title}</h2>
              <p className="text-slate-300 text-sm mb-8 max-w-md mx-auto">
                {kind === "link" ? t("linkHint") : t("downloadHint")}
              </p>
              {!actionUrl ? (
                <p className="text-slate-400">{t("noFile")}</p>
              ) : kind === "link" ? (
                <a
                  href={actionUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 bg-teal-500 hover:bg-teal-400 text-white px-10 py-4 rounded-2xl font-black text-lg shadow-xl shadow-teal-900/50 transition-all active:scale-95"
                >
                  {t("openGame")}
                  <span aria-hidden>↗</span>
                </a>
              ) : (
                <a
                  href={actionUrl}
                  download={game.file_name || true}
                  className="inline-flex items-center gap-3 bg-teal-500 hover:bg-teal-400 text-white px-10 py-4 rounded-2xl font-black text-lg shadow-xl shadow-teal-900/50 transition-all active:scale-95"
                >
                  <span aria-hidden>⬇</span>
                  {t("downloadGame")}
                </a>
              )}
              {kind === "download" && game.file_name && (
                <p className="text-slate-400 text-xs mt-4">
                  {game.file_name}{fileSize ? ` · ${fileSize}` : ""}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Game info below player */}
      <div className="max-w-4xl mx-auto px-4 mt-8">
        {/* Back link */}
        <Link href="/games" className="inline-flex items-center gap-1.5 text-slate-500 hover:text-teal-600 text-sm mb-6 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {t("allGames")}
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left: info */}
          <div className="md:col-span-2 space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-teal-50 text-teal-700 text-xs font-bold px-2.5 py-1 rounded-full">{typeLabel}</span>
              </div>
              <h1 className="text-3xl font-black text-slate-800">{game.title}</h1>
              {game.description && (
                <p className="text-slate-500 mt-2 leading-relaxed">{game.description}</p>
              )}
            </div>

            {/* Instructions */}
            {game.instructions && (
              <div className="bg-slate-50 rounded-2xl p-5">
                <h2 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 bg-teal-100 rounded-full flex items-center justify-center text-teal-600 text-xs">?</span>
                  {t("instructions")}
                </h2>
                <div className="text-sm text-slate-600 whitespace-pre-line leading-relaxed">
                  {game.instructions}
                </div>
              </div>
            )}
          </div>

          {/* Right: developer card */}
          <div>
            <div className="bg-white rounded-2xl border p-5 shadow-sm">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">{t("developer")}</p>
              <div className="flex items-center gap-3">
                {game.developer_avatar ? (
                  <img src={fixImageUrl(game.developer_avatar, '')} alt={game.developer_name} className="w-12 h-12 rounded-full object-cover border" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-lg">
                      {(game.developer_name || "N").charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div>
                  <p className="font-bold text-slate-800">{game.developer_name || t("unknown")}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{t("developer")}</p>
                </div>
              </div>

              <div className="border-t mt-4 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">{t("format")}</span>
                  <span className="font-semibold text-slate-700">{typeLabel}</span>
                </div>
                {kind === "download" && game.file_name && (
                  <div className="flex justify-between gap-3 text-sm">
                    <span className="text-slate-400 shrink-0">{t("file")}</span>
                    <span className="font-semibold text-slate-700 truncate" title={game.file_name}>{game.file_name}</span>
                  </div>
                )}
                {kind === "download" && fileSize && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">{t("size")}</span>
                    <span className="font-semibold text-slate-700">{fileSize}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">{t("added")}</span>
                  <span className="font-semibold text-slate-700">{formatDate(game.CreatedAt, locale)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* ── RELATED ── */}
      <div className="max-w-4xl mx-auto px-4">
        <RelatedSectionBlock title={t("otherGames")}>
          <RelatedGameCard
            game={{ title: t("gamequizTitle"), game_type: "WebGL", developer_name: "NICE School", thumbnail: "" }}
            href="/gamequiz"
          />
          {otherGames.map((g) => (
            <RelatedGameCard key={g.ID} game={g} href={`/games/${g.ID}`} />
          ))}
        </RelatedSectionBlock>
      </div>
    </main>
  );
}
