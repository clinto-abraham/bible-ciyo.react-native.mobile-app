export interface TranslationRegistryEntry {
  id: string;
  displayName: string;
  nativeName: string;
  language: string;
  flag: string;
  dir: 'ltr' | 'rtl';
  translation: string;
  booksCount: number;
  firstBook: string;
  dbIdentifier: string;
  originalFilename: string;
  available: boolean;
}

export const TRANSLATION_REGISTRY: readonly TranslationRegistryEntry[] = [
  {
    id: 'hebrew',
    displayName: 'Biblical Hebrew',
    nativeName: 'עִבְרִית',
    language: 'Hebrew',
    flag: '🇮🇱',
    dir: 'rtl',
    translation: 'Westminster Leningrad Codex (WLC)',
    booksCount: 39,
    firstBook: 'genesis',
    dbIdentifier: 'hebrew',
    originalFilename: 'hebrew.json',
    available: true,
  },
  {
    id: 'english',
    displayName: 'English (KJV)',
    nativeName: 'English',
    language: 'English',
    flag: '🇬🇧',
    dir: 'ltr',
    translation: 'King James Version (1769)',
    booksCount: 66,
    firstBook: 'genesis',
    dbIdentifier: 'english',
    originalFilename: 'english.json',
    available: true,
  },
  {
    id: 'english-bsb',
    displayName: 'English (Berean Standard Bible)',
    nativeName: 'Berean Standard Bible',
    language: 'English',
    flag: '🇺🇸',
    dir: 'ltr',
    translation: 'Berean Standard Bible (BSB)',
    booksCount: 66,
    firstBook: 'genesis',
    dbIdentifier: 'english-bsb',
    originalFilename: 'english-bsb.json',
    available: true,
  },
  {
    id: 'english-ylt',
    displayName: "English (Young's Literal Translation)",
    nativeName: "Young's Literal Translation",
    language: 'English',
    flag: '🇬🇧',
    dir: 'ltr',
    translation: "Young's Literal Translation (YLT 1898)",
    booksCount: 66,
    firstBook: 'genesis',
    dbIdentifier: 'english-ylt',
    originalFilename: 'english-ylt.json',
    available: true,
  },
  {
    id: 'malayalam',
    displayName: 'Malayalam (സത്യവേദപുസ്തകം)',
    nativeName: 'മലയാളം',
    language: 'Malayalam',
    flag: '🇮🇳',
    dir: 'ltr',
    translation: 'Sathyavedapusthakam (1910)',
    booksCount: 66,
    firstBook: 'genesis',
    dbIdentifier: 'malayalam',
    originalFilename: 'malayalam.json',
    available: true,
  },
  {
    id: 'greek',
    displayName: 'Koine Greek',
    nativeName: 'Ἑλληνική',
    language: 'Greek',
    flag: '🇬🇷',
    dir: 'ltr',
    translation: 'Textus Receptus (1550/1894)',
    booksCount: 27,
    firstBook: 'matthew',
    dbIdentifier: 'greek',
    originalFilename: 'greek.json',
    available: true,
  },
  {
    id: 'aramaic',
    displayName: 'Aramaic (Syriac Peshitta)',
    nativeName: 'ܐܪܡܝܐ (Peshitta)',
    language: 'Syriac Aramaic',
    flag: '🇸🇾',
    dir: 'rtl',
    translation: 'Syriac Peshitta New Testament',
    booksCount: 27,
    firstBook: 'matthew',
    dbIdentifier: 'aramaic',
    originalFilename: 'aramaic.json',
    available: true,
  },
  {
    id: 'latin',
    displayName: 'Latin (Biblia Sacra Vulgata)',
    nativeName: 'Latina',
    language: 'Latin',
    flag: '🇻🇦',
    dir: 'ltr',
    translation: 'Latin Vulgate',
    booksCount: 78,
    firstBook: 'genesis',
    dbIdentifier: 'latin',
    originalFilename: 'latin.json',
    available: true,
  },
  {
    id: 'german',
    displayName: 'German (Elberfelder 1905)',
    nativeName: 'Deutsch',
    language: 'German',
    flag: '🇩🇪',
    dir: 'ltr',
    translation: 'Unrevidierte Elberfelder (1905)',
    booksCount: 66,
    firstBook: 'genesis',
    dbIdentifier: 'german',
    originalFilename: 'german.json',
    available: true,
  },
  {
    id: 'french',
    displayName: 'French (Augustin Crampon)',
    nativeName: 'Français',
    language: 'French',
    flag: '🇫🇷',
    dir: 'ltr',
    translation: 'Bible Augustin Crampon (1923)',
    booksCount: 73,
    firstBook: 'genesis',
    dbIdentifier: 'french',
    originalFilename: 'french.json',
    available: true,
  },
  {
    id: 'spanish',
    displayName: 'Spanish (Reina-Valera 1909)',
    nativeName: 'Español',
    language: 'Spanish',
    flag: '🇪🇸',
    dir: 'ltr',
    translation: 'La Santa Biblia Reina-Valera (1909)',
    booksCount: 66,
    firstBook: 'genesis',
    dbIdentifier: 'spanish',
    originalFilename: 'spanish.json',
    available: true,
  },
  {
    id: 'russian',
    displayName: 'Russian (Синодальный перевод)',
    nativeName: 'Русский',
    language: 'Russian',
    flag: '🇷🇺',
    dir: 'ltr',
    translation: 'Синодального Перевода Библии',
    booksCount: 78,
    firstBook: 'genesis',
    dbIdentifier: 'russian',
    originalFilename: 'russian.json',
    available: true,
  },
  {
    id: 'chinese',
    displayName: 'Chinese (和合本 繁體字)',
    nativeName: '中文 (和合本)',
    language: 'Chinese',
    flag: '🇨🇳',
    dir: 'ltr',
    translation: '和合本 (繁體字 ChiUn)',
    booksCount: 66,
    firstBook: 'genesis',
    dbIdentifier: 'chinese',
    originalFilename: 'chinese.json',
    available: true,
  },
  {
    id: 'burmese',
    displayName: 'Burmese Judson',
    nativeName: 'မြန်မာဘာသာ',
    language: 'Burmese',
    flag: '🇲🇲',
    dir: 'ltr',
    translation: '1835 Judson Burmese Bible',
    booksCount: 66,
    firstBook: 'genesis',
    dbIdentifier: 'burmese',
    originalFilename: 'burmese.json',
    available: true,
  },
  {
    id: 'slavic',
    displayName: 'Church Slavonic',
    nativeName: 'Церковнославя́нскій',
    language: 'Church Slavonic',
    flag: '☦️',
    dir: 'ltr',
    translation: '1757 Elizabeth Bible',
    booksCount: 76,
    firstBook: 'genesis',
    dbIdentifier: 'slavic',
    originalFilename: 'slavic.json',
    available: true,
  },
] as const;

const REGISTRY_BY_ID = new Map<string, TranslationRegistryEntry>(
  TRANSLATION_REGISTRY.map((entry) => [entry.id, entry])
);

export function normalizeTranslationId(translationId: string): string {
  const norm = (translationId || '').trim().toLowerCase().replace(/\s+/g, '-');
  if (REGISTRY_BY_ID.has(norm)) {
    return norm;
  }
  throw new Error(
    `Invalid translation identifier "${translationId}". Registered translations: ${TRANSLATION_REGISTRY.map((t) => t.id).join(', ')}`
  );
}

export function getTranslationEntry(translationId: string): TranslationRegistryEntry {
  const id = normalizeTranslationId(translationId);
  return REGISTRY_BY_ID.get(id)!;
}
