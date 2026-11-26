import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  SQLiteDatabase,
  deleteDatabaseAsync,
  importDatabaseFromAssetAsync,
  openDatabaseAsync,
} from 'expo-sqlite';

import hebrewBooks from '@/data/books/hebrew.json';
import englishBooks from '@/data/books/english.json';
import englishBsbBooks from '@/data/books/english-bsb.json';
import englishYltBooks from '@/data/books/english-ylt.json';
import malayalamBooks from '@/data/books/malayalam.json';
import greekBooks from '@/data/books/greek.json';
import aramaicBooks from '@/data/books/aramaic.json';
import latinBooks from '@/data/books/latin.json';
import germanBooks from '@/data/books/german.json';
import frenchBooks from '@/data/books/french.json';
import spanishBooks from '@/data/books/spanish.json';
import russianBooks from '@/data/books/russian.json';
import chineseBooks from '@/data/books/chinese.json';
import burmeseBooks from '@/data/books/burmese.json';
import slavicBooks from '@/data/books/slavic.json';

import {
  TRANSLATION_REGISTRY,
  getTranslationEntry,
  normalizeTranslationId,
} from './translations';

export const BIBLE_SCHEMA_VERSION = '1';
export const BIBLE_CONTENT_VERSION = '2026.11.1';
export const BIBLE_DATABASE_VERSION = '1.0.0';

const DB_NAME = 'bible_offline_v1.db';
const TMP_DB_NAME = 'bible_offline_tmp.db';
const DB_VERSION_STORAGE_KEY = 'bible_db_installed_version';

export interface BibleVerse {
  verse: number;
  text: string;
}

export interface BibleSearchResult extends BibleVerse {
  book: string;
  chapter: number;
}

export interface BibleChapter {
  book: string;
  chapter: number;
  verses: BibleVerse[];
}

export interface BibleDataService {
  getAvailableTranslations(): Promise<string[]>;
  getBooks(translation: string): Promise<string[]>;
  getChapters(translation: string, book: string): Promise<number[]>;
  getChapter(translation: string, book: string, chapter: number): Promise<BibleChapter>;
  getVerse(
    translation: string,
    book: string,
    chapter: number,
    verse: number
  ): Promise<BibleVerse | null>;
  searchVerses(
    translation: string,
    query: string,
    limit?: number,
    offset?: number
  ): Promise<BibleSearchResult[]>;
}

export type Verse = BibleVerse;

export interface ChapterData {
  translation: string;
  language: string;
  dir?: 'ltr' | 'rtl';
  bookName: string;
  bookSlug: string;
  nativeName?: string;
  hebrewName?: string;
  chapterNumber: number;
  totalVerses: number;
  verses: Verse[];
  totalChapters?: number;
  prevChapter?: { book: string; chapter: number; lang?: string } | null;
  nextChapter?: { book: string; chapter: number; lang?: string } | null;
}

export interface BookMeta {
  name: string;
  slug: string;
  nativeName?: string;
  hebrewName?: string;
  chapterCount: number;
  language?: string;
  dir?: 'ltr' | 'rtl';
  testament?: string;
  textSource?: string;
}

export interface LanguageMeta {
  id: string;
  name: string;
  nativeName: string;
  flag: string;
  dir: 'ltr' | 'rtl';
  translation: string;
  booksCount: number;
  firstBook: string;
}

export interface WordBreakdown {
  hebrew: string;
  transliteration: string;
  root: string;
  meaning: string;
  grammar: string;
}

export interface ComparativeVerse {
  langId: string;
  name: string;
  badge: string;
  text: string;
  dir: 'ltr' | 'rtl';
  available: boolean;
  unavailableReason?: string;
  theme: {
    border: string;
    bg: string;
    badgeBg: string;
    badgeBorder: string;
    badgeText: string;
    textColor: string;
    copyBg: string;
    copyBorder: string;
    copyText: string;
  };
}

export interface VerseDetails {
  book: string;
  bookName: string;
  nativeName?: string;
  chapter: number;
  verse: number;
  primaryText: string;
  language: string;
  comparisons: ComparativeVerse[];
  hebrewText?: string;
  greekText?: string;
  englishText?: string;
  aramaicText?: string;
  transliteration?: string;
  englishLiteral?: string;
  kjv?: string;
  breakdown: WordBreakdown[];
  manuscriptNotes: string;
  codexSource: string;
}

export const NT_BOOKS = [
  'matthew', 'mark', 'luke', 'john', 'acts', 'romans', '1-corinthians', '2-corinthians',
  'galatians', 'ephesians', 'philippians', 'colossians', '1-thessalonians', '2-thessalonians',
  '1-timothy', '2-timothy', 'titus', 'philemon', 'hebrews', 'james', '1-peter', '2-peter',
  '1-john', '2-john', '3-john', 'jude', 'revelation',
];

export const TORAH_SLUGS = ['genesis', 'exodus', 'leviticus', 'numbers', 'deuteronomy'];
export const NEVIIM_SLUGS = [
  'joshua', 'judges', '1-samuel', '2-samuel', '1-kings', '2-kings', 'isaiah',
  'jeremiah', 'ezekiel', 'hosea', 'joel', 'amos', 'obadiah', 'jonah', 'micah',
  'nahum', 'habakkuk', 'zephaniah', 'haggai', 'zechariah', 'malachi',
];
export const GOSPELS_SLUGS = ['matthew', 'mark', 'luke', 'john', 'acts'];

export function slugifyBook(nameOrSlug: string): string {
  const s = decodeURIComponent(nameOrSlug)
    .trim()
    .toLowerCase()
    .replace(/^i\s+/, '1-')
    .replace(/^ii\s+/, '2-')
    .replace(/^iii\s+/, '3-')
    .replace(/^1st\s+/, '1-')
    .replace(/^2nd\s+/, '2-')
    .replace(/^3rd\s+/, '3-')
    .replace(/\s+of\s+john$/, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');

  if (s === 'song-of-solomon') return 'song-of-solomon';
  if (s === 'revelation-of-john') return 'revelation';
  return s;
}

const BOOKS_BY_LANG: Record<string, BookMeta[]> = {
  hebrew: hebrewBooks as BookMeta[],
  english: englishBooks as BookMeta[],
  'english-bsb': englishBsbBooks as BookMeta[],
  'english-ylt': englishYltBooks as BookMeta[],
  malayalam: malayalamBooks as BookMeta[],
  greek: greekBooks as BookMeta[],
  aramaic: aramaicBooks as BookMeta[],
  latin: latinBooks as BookMeta[],
  german: germanBooks as BookMeta[],
  french: frenchBooks as BookMeta[],
  spanish: spanishBooks as BookMeta[],
  russian: russianBooks as BookMeta[],
  chinese: chineseBooks as BookMeta[],
  burmese: burmeseBooks as BookMeta[],
  slavic: slavicBooks as BookMeta[],
};

let dbPromise: Promise<SQLiteDatabase> | null = null;

async function verifyDatabaseIntegrity(db: SQLiteDatabase): Promise<boolean> {
  try {
    const meta = await db.getFirstAsync<{ value: string }>(
      "SELECT value FROM db_meta WHERE key = 'database_version'"
    );
    if (!meta || meta.value !== BIBLE_DATABASE_VERSION) {
      return false;
    }
    const sample = await db.getFirstAsync<{ verse: number }>(
      'SELECT verse FROM verses LIMIT 1'
    );
    return sample !== null && sample !== undefined;
  } catch {
    return false;
  }
}

async function openAndInitializeDatabase(): Promise<SQLiteDatabase> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const assetId = require('../../assets/bible.db') as number;
  if (!assetId) {
    throw new Error('Bundled Bible database asset (assets/bible.db) could not be resolved.');
  }

  let installedVersion: string | null = null;
  try {
    installedVersion = await AsyncStorage.getItem(DB_VERSION_STORAGE_KEY);
  } catch {
    installedVersion = null;
  }

  // Reuse existing verified database without overwriting on subsequent launches
  if (installedVersion === BIBLE_DATABASE_VERSION) {
    try {
      const existingDb = await openDatabaseAsync(DB_NAME);
      const valid = await verifyDatabaseIntegrity(existingDb);
      if (valid) {
        await existingDb.execAsync('PRAGMA query_only = ON;');
        return existingDb;
      }
      await existingDb.closeAsync();
    } catch {
      // Fall through to safe re-import if existing DB is missing or invalid
    }
  }

  // Stage bundled database into a temporary file and verify before replacing active DB
  await importDatabaseFromAssetAsync(TMP_DB_NAME, {
    assetId,
    forceOverwrite: true,
  });

  const tmpDb = await openDatabaseAsync(TMP_DB_NAME);
  const tmpValid = await verifyDatabaseIntegrity(tmpDb);
  await tmpDb.closeAsync();

  if (!tmpValid) {
    await deleteDatabaseAsync(TMP_DB_NAME).catch(() => {});
    throw new Error('Bundled Bible database failed integrity verification after import.');
  }

  await deleteDatabaseAsync(DB_NAME).catch(() => {});
  await importDatabaseFromAssetAsync(DB_NAME, {
    assetId,
    forceOverwrite: true,
  });
  await deleteDatabaseAsync(TMP_DB_NAME).catch(() => {});

  const db = await openDatabaseAsync(DB_NAME);
  const valid = await verifyDatabaseIntegrity(db);
  if (!valid) {
    await db.closeAsync().catch(() => {});
    throw new Error('Installed Bible database failed post-copy verification.');
  }

  await db.execAsync('PRAGMA query_only = ON;');
  await AsyncStorage.setItem(DB_VERSION_STORAGE_KEY, BIBLE_DATABASE_VERSION).catch(() => {});
  return db;
}

export async function initializeBibleDatabase(): Promise<SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = openAndInitializeDatabase().catch((err) => {
      dbPromise = null;
      throw err;
    });
  }
  return dbPromise;
}

export function getLanguages(): LanguageMeta[] {
  return TRANSLATION_REGISTRY.map((entry) => ({
    id: entry.id,
    name: entry.displayName,
    nativeName: entry.nativeName,
    flag: entry.flag,
    dir: entry.dir,
    translation: entry.translation,
    booksCount: entry.booksCount,
    firstBook: entry.firstBook,
  }));
}

export function getBooks(lang = 'english'): BookMeta[] {
  const id = normalizeTranslationId(lang);
  const list = BOOKS_BY_LANG[id] || [];
  return list.map((b) => ({
    ...b,
    hebrewName: b.nativeName || b.hebrewName || '',
  }));
}

async function getBooksFromSqlite(translationId: string): Promise<BookMeta[]> {
  const entry = getTranslationEntry(translationId);
  const db = await initializeBibleDatabase();
  const rows = await db.getAllAsync<{
    slug: string;
    name: string;
    native_name: string | null;
    chapter_count: number;
  }>(
    'SELECT slug, name, native_name, chapter_count FROM books WHERE translation = ? ORDER BY book_order ASC',
    [entry.dbIdentifier]
  );

  return rows.map((r) => ({
    slug: r.slug,
    name: r.name,
    nativeName: r.native_name || '',
    hebrewName: r.native_name || '',
    chapterCount: r.chapter_count,
  }));
}

export function getBookBySlug(slugOrName: string, lang = 'english'): BookMeta | null {
  const books = getBooks(lang);
  const normalized = slugifyBook(slugOrName);
  return books.find((b) => b.slug === normalized || slugifyBook(b.name) === normalized) || null;
}

export const bibleDataService: BibleDataService = {
  async getAvailableTranslations(): Promise<string[]> {
    return TRANSLATION_REGISTRY.filter((t) => t.available).map((t) => t.id);
  },

  async getBooks(translation: string): Promise<string[]> {
    const id = normalizeTranslationId(translation);
    const books = await getBooksFromSqlite(id);
    return books.map((b) => b.slug);
  },

  async getChapters(translation: string, book: string): Promise<number[]> {
    const id = normalizeTranslationId(translation);
    const entry = getTranslationEntry(id);
    const slug = slugifyBook(book);
    const db = await initializeBibleDatabase();
    const rows = await db.getAllAsync<{ chapter: number }>(
      'SELECT DISTINCT chapter FROM verses WHERE translation = ? AND book = ? ORDER BY chapter ASC',
      [entry.dbIdentifier, slug]
    );
    return rows.map((r) => r.chapter);
  },

  async getChapter(translation: string, book: string, chapter: number): Promise<BibleChapter> {
    const id = normalizeTranslationId(translation);
    const entry = getTranslationEntry(id);
    const slug = slugifyBook(book);
    if (!Number.isInteger(chapter) || chapter < 1) {
      throw new Error(`Invalid chapter number "${chapter}" for ${slug}.`);
    }

    const db = await initializeBibleDatabase();
    const verses = await db.getAllAsync<BibleVerse>(
      'SELECT verse, text FROM verses WHERE translation = ? AND book = ? AND chapter = ? ORDER BY verse ASC',
      [entry.dbIdentifier, slug, chapter]
    );

    if (verses.length === 0) {
      throw new Error(`Chapter ${slug} ${chapter} not found in translation "${id}".`);
    }

    return {
      book: slug,
      chapter,
      verses,
    };
  },

  async getVerse(
    translation: string,
    book: string,
    chapter: number,
    verse: number
  ): Promise<BibleVerse | null> {
    const id = normalizeTranslationId(translation);
    const entry = getTranslationEntry(id);
    const slug = slugifyBook(book);
    const db = await initializeBibleDatabase();
    const row = await db.getFirstAsync<BibleVerse>(
      'SELECT verse, text FROM verses WHERE translation = ? AND book = ? AND chapter = ? AND verse = ?',
      [entry.dbIdentifier, slug, chapter, verse]
    );
    return row || null;
  },

  async searchVerses(
    translation: string,
    query: string,
    limit = 50,
    offset = 0
  ): Promise<BibleSearchResult[]> {
    const id = normalizeTranslationId(translation);
    const entry = getTranslationEntry(id);
    const trimmed = query.trim();
    if (!trimmed) return [];
    const db = await initializeBibleDatabase();
    return db.getAllAsync<BibleSearchResult>(
      'SELECT book, chapter, verse, text FROM verses WHERE translation = ? AND text LIKE ? ORDER BY book, chapter, verse LIMIT ? OFFSET ?',
      [entry.dbIdentifier, `%${trimmed}%`, limit, offset]
    );
  },
};

export async function getChapterData(
  bookParam: string,
  chapterParam: string | number,
  langParam = 'english',
  allowFallback = true
): Promise<ChapterData | null> {
  let lang = normalizeTranslationId(langParam || 'english');
  const slug = slugifyBook(bookParam);
  const chapterNumber = Number.parseInt(String(chapterParam), 10);

  if (Number.isNaN(chapterNumber) || chapterNumber < 1) {
    return null;
  }

  if (allowFallback) {
    if (lang === 'hebrew' && NT_BOOKS.includes(slug)) {
      lang = 'greek';
    } else if (lang === 'aramaic' && !NT_BOOKS.includes(slug) && slug !== 'genesis') {
      lang = 'hebrew';
    }
  }

  const db = await initializeBibleDatabase();
  let books = await getBooksFromSqlite(lang);
  let bookIndex = books.findIndex((b) => b.slug === slug || slugifyBook(b.name) === slug);
  let currentBook = bookIndex !== -1 ? books[bookIndex] : null;
  let actualSlug = currentBook ? currentBook.slug : slug;

  let verses = await db.getAllAsync<Verse>(
    'SELECT verse, text FROM verses WHERE translation = ? AND book = ? AND chapter = ? ORDER BY verse ASC',
    [getTranslationEntry(lang).dbIdentifier, actualSlug, chapterNumber]
  );

  if (verses.length === 0 && allowFallback) {
    const altLangs = ['english', 'greek', 'hebrew', 'slavic', 'burmese'].filter((l) => l !== lang);
    for (const alt of altLangs) {
      const altBooks = await getBooksFromSqlite(alt);
      const altIdx = altBooks.findIndex((b) => b.slug === slug || slugifyBook(b.name) === slug);
      const altBook = altIdx !== -1 ? altBooks[altIdx] : null;
      const altSlug = altBook ? altBook.slug : slug;
      const altVerses = await db.getAllAsync<Verse>(
        'SELECT verse, text FROM verses WHERE translation = ? AND book = ? AND chapter = ? ORDER BY verse ASC',
        [getTranslationEntry(alt).dbIdentifier, altSlug, chapterNumber]
      );
      if (altVerses.length > 0) {
        lang = alt;
        books = altBooks;
        bookIndex = altIdx;
        currentBook = altBook;
        actualSlug = altSlug;
        verses = altVerses;
        break;
      }
    }
  }

  if (verses.length === 0) {
    return null;
  }

  const entry = getTranslationEntry(lang);

  const enriched: ChapterData = {
    translation: entry.translation,
    language: lang,
    dir: entry.dir,
    bookName: currentBook?.name || actualSlug,
    bookSlug: actualSlug,
    nativeName: currentBook?.nativeName || currentBook?.hebrewName,
    hebrewName: currentBook?.nativeName || currentBook?.hebrewName,
    chapterNumber,
    totalVerses: verses.length,
    verses,
  };

  if (currentBook) {
    enriched.totalChapters = currentBook.chapterCount;

    if (chapterNumber > 1) {
      enriched.prevChapter = { book: currentBook.slug, chapter: chapterNumber - 1, lang };
    } else if (bookIndex > 0) {
      const prevBook = books[bookIndex - 1];
      enriched.prevChapter = { book: prevBook.slug, chapter: prevBook.chapterCount, lang };
    } else {
      enriched.prevChapter = null;
    }

    if (chapterNumber < currentBook.chapterCount) {
      enriched.nextChapter = { book: currentBook.slug, chapter: chapterNumber + 1, lang };
    } else if (bookIndex < books.length - 1) {
      const nextBook = books[bookIndex + 1];
      enriched.nextChapter = { book: nextBook.slug, chapter: 1, lang };
    } else {
      enriched.nextChapter = null;
    }
  }

  return enriched;
}

const VOCAB_MAP: Record<string, { translit: string; root: string; gloss: string; grammar: string }> = {
  'בְּרֵאשִׁ֖ית': { translit: "B'reshít", root: 'ר־א־שׁ (rosh)', gloss: 'In the beginning', grammar: 'Prep. + Noun fem. sing. construct' },
  'בָּרָ֣א': { translit: 'Bará', root: 'ב־ר־א (bara)', gloss: 'Created / brought into being', grammar: 'Verb Qal perfect 3ms' },
  'אֱלֹהִ֑ים': { translit: 'Elohím', root: 'א־ל־ה (eloah)', gloss: 'God / Supreme Deity', grammar: 'Noun masc. plural of majesty' },
  'אֵ֥ת': { translit: 'Et', root: 'את', gloss: '[Direct object marker]', grammar: 'Untranslated accusative particle' },
  'הַשָּׁמַ֖יִם': { translit: 'Ha-shamáyim', root: 'ש־מ־י (shamayim)', gloss: 'The heavens / sky', grammar: 'Def. art. + Noun dual/plural' },
  'וְאֵ֥ת': { translit: "V'et", root: 'את', gloss: 'and [direct object marker]', grammar: 'Conj. + Accusative particle' },
  'הָאָֽרֶץ': { translit: "Ha'áretz", root: 'א־ר־ץ (eretz)', gloss: 'The earth / land', grammar: 'Def. art. + Noun fem. sing.' },
  'וְהָאָ֗רֶץ': { translit: "V'ha'áretz", root: 'א־ר־ץ (eretz)', gloss: 'Now the earth', grammar: 'Conj. + Def. art. + Noun' },
  'הָיְתָ֥ה': { translit: "Hay'tah", root: 'ה־י־ה (hayah)', gloss: 'Was / existed', grammar: 'Verb Qal perfect 3fs' },
  'תֹ֙הוּ֙': { translit: 'Tóhu', root: 'תהה', gloss: 'Formless / chaos / void', grammar: 'Noun masc. sing' },
  'וָבֹ֔הוּ': { translit: 'Va-vóhu', root: 'בהה', gloss: 'and empty / desolate', grammar: 'Conj. + Noun masc. sing.' },
  'וְחֹ֖שֶׁךְ': { translit: "V'chóshekh", root: 'ח־ש־ך (chashekh)', gloss: 'and darkness', grammar: 'Conj. + Noun masc. sing.' },
  'עַל־פְּנֵ֣י': { translit: "Al-p'nei", root: 'פ־נ־ה (panim)', gloss: 'over the face / surface of', grammar: 'Prep. + Noun pl. construct' },
  'תְה֑וֹם': { translit: 'Tehóm', root: 'ת־ה־ם (tehom)', gloss: 'The deep / watery abyss', grammar: 'Noun fem. sing.' },
  'וְר֣וּחַ': { translit: "V'rúach", root: 'ר־ו־ח (ruach)', gloss: 'and the Spirit / breath / wind of', grammar: 'Conj. + Noun fem. construct' },
  'מְרַחֶ֖פֶת': { translit: "M'rachéfet", root: 'ר־ח־ף (rachaf)', gloss: 'Hovering / brooding over', grammar: 'Verb Piel participle fs' },
  'הַמָּֽיִם': { translit: 'Ham-máyim', root: 'מ־י־ם (mayim)', gloss: 'The waters', grammar: 'Def. art. + Noun masc. dual/plural' },
  'וַיֹּ֥אמֶר': { translit: "Vayyómer", root: 'א־מ־ר (amar)', gloss: 'And He said', grammar: 'Vav consecutive + Verb Qal impf 3ms' },
  'יְהִ֣י': { translit: "Y'hí", root: 'ה־י־ה (hayah)', gloss: 'Let there be / become', grammar: 'Verb Qal jussive 3ms' },
  'א֑וֹר': { translit: 'Or', root: 'א־ו־ר (or)', gloss: 'Light', grammar: 'Noun masc. sing.' },
  'וַֽיְהִי־אֽוֹר': { translit: "Vay'hi-or", root: 'ה־י־ה / א־ו־ר', gloss: 'and there was light', grammar: 'Vav consecutive + Verb + Noun' },
  'שְׁמַ֖ע': { translit: 'Shemá', root: 'ש־מ־ע (shama)', gloss: 'Hear! / Listen attentively', grammar: 'Verb Qal imperative ms' },
  'יִשְׂרָאֵ֑ל': { translit: "Yisra'él", root: 'שׂרה + אל', gloss: 'Israel (He strives with God)', grammar: 'Proper name' },
  'יְהוָ֥ה': { translit: 'YHWH / Adonai', root: 'ה־ו־ה (havah - To Be)', gloss: 'The LORD / Eternal Covenant Name', grammar: 'Tetragrammaton (Four Letters)' },
  'אֱלֹהֵ֖ינוּ': { translit: "Elohéinu", root: 'א־ל־ה', gloss: 'Our God', grammar: 'Noun masc. pl. + 1cp suffix' },
  'אֶחָֽד': { translit: 'Echád', root: 'א־ח־ד (achad)', gloss: 'One / Unified / Unique', grammar: 'Adjective masc. sing.' },
};

export async function getVerseDetails(
  bookParam: string,
  chapterParam: string | number,
  verseParam: string | number,
  langParam = 'english'
): Promise<VerseDetails | null> {
  const currentChapter = await getChapterData(bookParam, chapterParam, langParam);
  if (!currentChapter) return null;

  const verseNumber = Number.parseInt(String(verseParam), 10);
  const targetVerse = currentChapter.verses.find((v) => v.verse === verseNumber);
  if (!targetVerse) return null;

  const [engChapter, hebChapter, araChapter, grkChapter] = await Promise.all([
    getChapterData(bookParam, chapterParam, 'english', false),
    getChapterData(bookParam, chapterParam, 'hebrew', false),
    getChapterData(bookParam, chapterParam, 'aramaic', false),
    getChapterData(bookParam, chapterParam, 'greek', false),
  ]);

  const englishText = engChapter?.verses.find((v) => v.verse === verseNumber)?.text || '';
  const hebrewText = hebChapter?.verses.find((v) => v.verse === verseNumber)?.text || '';
  const aramaicText = araChapter?.verses.find((v) => v.verse === verseNumber)?.text || '';
  const greekText = grkChapter?.verses.find((v) => v.verse === verseNumber)?.text || '';

  const sourceWords = (hebrewText || targetVerse.text)
    .replace(/[׃.,;:!?]/g, '')
    .trim()
    .split(/\s+/);

  const breakdown: WordBreakdown[] = sourceWords.slice(0, 10).map((word) => {
    const cleanWord = word.replace(/[\u0591-\u05AF]/g, '');
    const entry = VOCAB_MAP[word] || VOCAB_MAP[cleanWord];
    if (entry) {
      return {
        hebrew: word,
        transliteration: entry.translit,
        root: entry.root,
        meaning: entry.gloss,
        grammar: entry.grammar,
      };
    }
    return {
      hebrew: word,
      transliteration: '—',
      root: 'Biblical Root',
      meaning: 'Original manuscript token',
      grammar: 'Vocalized grammatical form',
    };
  });

  const comparisons: ComparativeVerse[] = [
    {
      langId: 'english',
      name: 'English Translation',
      badge: 'King James Version (KJV)',
      text: englishText,
      dir: 'ltr',
      available: !!englishText,
      unavailableReason: 'English text not available for this verse.',
      theme: {
        border: 'rgba(14, 165, 233, 0.4)',
        bg: 'rgba(12, 74, 110, 0.25)',
        badgeBg: 'rgba(14, 165, 233, 0.12)',
        badgeBorder: 'rgba(14, 165, 233, 0.35)',
        badgeText: '#7DD3FC',
        textColor: '#E0F2FE',
        copyBg: 'rgba(8, 47, 73, 0.85)',
        copyBorder: 'rgba(3, 105, 161, 0.7)',
        copyText: '#BAE6FD',
      },
    },
    {
      langId: 'hebrew',
      name: 'Biblical Hebrew',
      badge: 'Westminster Leningrad Codex (WLC)',
      text: hebrewText,
      dir: 'rtl',
      available: !!hebrewText,
      unavailableReason: 'Hebrew Masoretic codex (WLC) preserves the Old Testament / Tanakh (Genesis – Malachi).',
      theme: {
        border: 'rgba(245, 158, 11, 0.4)',
        bg: 'rgba(120, 53, 15, 0.25)',
        badgeBg: 'rgba(245, 158, 11, 0.12)',
        badgeBorder: 'rgba(245, 158, 11, 0.35)',
        badgeText: '#FCD34D',
        textColor: '#FEF3C7',
        copyBg: 'rgba(69, 26, 3, 0.85)',
        copyBorder: 'rgba(180, 83, 9, 0.7)',
        copyText: '#FDE68A',
      },
    },
    {
      langId: 'aramaic',
      name: 'Syriac Aramaic',
      badge: 'Peshitta Codex (ܐܪܡܝܐ)',
      text: aramaicText,
      dir: 'rtl',
      available: !!aramaicText,
      unavailableReason: 'Syriac Peshitta in this library preserves the New Testament canon (Matthew – Revelation) & Genesis 1.',
      theme: {
        border: 'rgba(168, 85, 247, 0.4)',
        bg: 'rgba(88, 28, 135, 0.25)',
        badgeBg: 'rgba(168, 85, 247, 0.12)',
        badgeBorder: 'rgba(168, 85, 247, 0.35)',
        badgeText: '#D8B4FE',
        textColor: '#F3E8FF',
        copyBg: 'rgba(59, 7, 100, 0.85)',
        copyBorder: 'rgba(126, 34, 206, 0.7)',
        copyText: '#E9D5FF',
      },
    },
  ];

  if (greekText) {
    comparisons.push({
      langId: 'greek',
      name: 'Koine Greek',
      badge: 'Textus Receptus (1550/1894)',
      text: greekText,
      dir: 'ltr',
      available: true,
      theme: {
        border: 'rgba(16, 185, 129, 0.4)',
        bg: 'rgba(6, 78, 59, 0.25)',
        badgeBg: 'rgba(16, 185, 129, 0.12)',
        badgeBorder: 'rgba(16, 185, 129, 0.35)',
        badgeText: '#6EE7B7',
        textColor: '#D1FAE5',
        copyBg: 'rgba(2, 44, 34, 0.85)',
        copyBorder: 'rgba(4, 120, 87, 0.7)',
        copyText: '#A7F3D0',
      },
    });
  }

  return {
    book: currentChapter.bookSlug,
    bookName: currentChapter.bookName,
    nativeName: currentChapter.nativeName,
    chapter: Number(chapterParam),
    verse: verseNumber,
    primaryText: targetVerse.text,
    language: currentChapter.language,
    comparisons,
    hebrewText,
    greekText,
    englishText,
    aramaicText,
    transliteration: breakdown.map((b) => b.transliteration).filter((t) => t !== '—').join(' ') || undefined,
    englishLiteral: englishText || `${currentChapter.bookName} ${chapterParam}:${verseParam}`,
    kjv: englishText,
    breakdown,
    manuscriptNotes:
      'Rendered from original historical manuscripts: Westminster Leningrad Codex (B19a, 1008 CE) for Old Testament Hebrew, and Textus Receptus (1550 Stephanus / 1894 Scrivener) for New Testament Greek, cross-referenced with historical translations.',
    codexSource: 'Primary source codices preserved in historical library archives.',
  };
}
