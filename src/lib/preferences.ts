import AsyncStorage from '@react-native-async-storage/async-storage';

export const PREFERRED_LANG_KEY = 'preferred_lang';
export const FONT_SIZE_KEY = 'bible_font_size';
export const BOOKMARKS_KEY = 'bible_bookmarks';

export type FontSizeLevel = 'normal' | 'huge' | 'colossal';

export interface BookmarkItem {
  id: string;
  bookSlug: string;
  bookName: string;
  chapterNumber: number;
  verseNumber: number;
  lang: string;
  textSnippet: string;
  createdAt: number;
  index: number;
}

type Listener = () => void;
const bookmarkListeners = new Set<Listener>();
const langListeners = new Set<(lang: string) => void>();

export function subscribeBookmarks(listener: Listener): () => void {
  bookmarkListeners.add(listener);
  return () => bookmarkListeners.delete(listener);
}

function notifyBookmarks() {
  bookmarkListeners.forEach((fn) => fn());
}

export function subscribePreferredLanguage(listener: (lang: string) => void): () => void {
  langListeners.add(listener);
  return () => langListeners.delete(listener);
}

export async function getPreferredLanguage(): Promise<string> {
  try {
    const val = await AsyncStorage.getItem(PREFERRED_LANG_KEY);
    return val || 'english';
  } catch {
    return 'english';
  }
}

export async function setPreferredLanguage(langId: string): Promise<void> {
  try {
    await AsyncStorage.setItem(PREFERRED_LANG_KEY, langId);
    langListeners.forEach((fn) => fn(langId));
  } catch {
    // ignore storage errors
  }
}

export async function getFontSize(): Promise<FontSizeLevel> {
  try {
    const val = await AsyncStorage.getItem(FONT_SIZE_KEY);
    if (val === 'normal' || val === 'huge' || val === 'colossal') {
      return val;
    }
  } catch {
    // ignore
  }
  return 'huge';
}

export async function setFontSize(size: FontSizeLevel): Promise<void> {
  try {
    await AsyncStorage.setItem(FONT_SIZE_KEY, size);
  } catch {
    // ignore
  }
}

export async function getBookmarks(): Promise<BookmarkItem[]> {
  try {
    const raw = await AsyncStorage.getItem(BOOKMARKS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function toggleBookmark(item: Omit<BookmarkItem, 'createdAt' | 'index'>): Promise<boolean> {
  const list = await getBookmarks();
  const idx = list.findIndex((b) => b.id === item.id);
  let added = false;

  if (idx !== -1) {
    list.splice(idx, 1);
    added = false;
  } else {
    list.push({
      ...item,
      createdAt: Date.now(),
      index: list.length + 1,
    });
    added = true;
  }

  try {
    await AsyncStorage.setItem(BOOKMARKS_KEY, JSON.stringify(list));
    notifyBookmarks();
  } catch {
    // ignore
  }
  return added;
}
