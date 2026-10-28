// How a game is offered on the site — set in the admin when adding it:
// played right on the page (HTML / legacy WebGL), opened on another site by
// link (External), or downloaded as a file (Download).
export type GameKind = 'play' | 'link' | 'download'

export function gameKind(gameType?: string): GameKind {
  if (gameType === 'External') return 'link'
  if (gameType === 'Download') return 'download'
  return 'play'
}

// The link goes into <a href>, so anything but http(s) (e.g. "javascript:") is dropped.
export function safeExternalUrl(url?: string): string {
  try {
    const u = new URL((url ?? '').trim())
    return u.protocol === 'http:' || u.protocol === 'https:' ? u.href : ''
  } catch {
    return ''
  }
}

// Badge text: the raw format for on-site games, a translated word otherwise.
// `t` is the "Games" translator.
export function gameTypeLabel(gameType: string | undefined, t: (key: string) => string): string {
  const kind = gameKind(gameType)
  if (kind === 'link') return t('typeLink')
  if (kind === 'download') return t('typeDownload')
  return gameType || 'HTML'
}

export function formatFileSize(bytes: number | undefined, t: (key: string) => string): string {
  if (!bytes) return ''
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} ${t('kb')}`
  return `${(bytes / 1024 / 1024).toFixed(1)} ${t('mb')}`
}
