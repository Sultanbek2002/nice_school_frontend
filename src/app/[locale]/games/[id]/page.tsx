import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import GamePlayer from "./GamePlayer";
import { GO_API_URL, fixImageUrl } from "@/utils/apiData";
import { RelatedGameCard, RelatedSectionBlock } from "@/app/components/RelatedSection";
import { pageMetadata, truncate, SITE_NAME } from "@/utils/seo";

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

  const gameUrl = game.game_type === "External" ? game.external_url : fixImageUrl(game.file_url, '');

  return (
    <main className="min-h-screen pt-24 pb-16">
      {/* Game player — full width */}
      <div className="w-full bg-black">
        <GamePlayer
          gameUrl={gameUrl}
          title={game.title}
          gameType={game.game_type}
        />
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
                <span className="bg-teal-50 text-teal-700 text-xs font-bold px-2.5 py-1 rounded-full">{game.game_type}</span>
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
                  <span className="font-semibold text-slate-700">{game.game_type}</span>
                </div>
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
