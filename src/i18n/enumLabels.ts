// Some backend fields hold fixed values picked from admin dropdowns (olympiad
// format, subjects, resource categories). The backend deliberately leaves them
// untranslated so code can compare/filter on the raw Russian value — only the
// displayed label is translated, here, via the "Enums" message namespace.
// Unknown values (admins can type new subjects) fall back to the raw value.
// Keys are lowercase: real data has "математика", "Физика " etc.
const ENUM_KEYS: Record<string, string> = {
  'онлайн': 'online',
  'оффлайн': 'offline',
  'офлайн': 'offline',
  'математика': 'math',
  'физика': 'physics',
  'химия': 'chemistry',
  'биология': 'biology',
  'кыргызский язык': 'kyrgyz',
  'кыргыз тил': 'kyrgyz',
  'кыргыз тили': 'kyrgyz',
  'русский язык': 'russian',
  'английский язык': 'english',
  'история': 'history',
  'география': 'geography',
  'информатика': 'informatics',
  'астрономия': 'astronomy',
  'технология': 'technology',
  'искусство': 'art',
  'другое': 'other',
  'разные': 'various',
  '5-класс': 'grade5',
  '6-класс': 'grade6',
  '7-класс': 'grade7',
  '8-класс': 'grade8',
  '9-класс': 'grade9',
  '10-класс': 'grade10',
  '11-класс': 'grade11',
  'орт': 'ort',
  'олимпиада': 'olympiad',
}

type EnumTranslator = (key: string) => string

const lookup = (s: string) => ENUM_KEYS[s.trim().toLowerCase()]

// tEnums is a translator for the "Enums" namespace — useTranslations('Enums')
// in client components, await getTranslations('Enums') in server components.
export function enumLabel(tEnums: EnumTranslator, raw: string | null | undefined): string {
  if (!raw) return ''
  const key = lookup(raw)
  if (key) return tEnums(key)
  // combined values typed by admins: "Математика, Кыргыз тил", "Математика и информатика"
  const parts = raw.split(/\s*,\s*|\s+и\s+/).map((p) => p.trim()).filter(Boolean)
  if (parts.length > 1 && parts.some((p) => lookup(p))) {
    return parts.map((p) => (lookup(p) ? tEnums(lookup(p)) : p)).join(', ')
  }
  return raw.trim()
}
