// Routes that live outside the [locale] segment on purpose (Live Test, and
// GameQuiz's live WS sessions) — real-time classroom tools, not browsable
// content. Links to these must stay plain (no locale prefix), while every
// other link should go through next-intl's locale-aware Link.
const EXCLUDED_PREFIXES = ['/test', '/gamequiz/join', '/gamequiz/host', '/gamequiz/play'] as const

export function isLocaleExcludedPath(href: string): boolean {
  return EXCLUDED_PREFIXES.some((p) => href === p || href.startsWith(`${p}/`))
}
