# Offline Bible Data Architecture (`bible-ciyo.react-native.mobile-app`)

## 1. Why SQLite Was Selected
- **O(1) Chapter Retrieval**: Each chapter is retrieved in `< 2 ms` via a clustered B-tree range scan without loading 433,719 verses into JavaScript memory.
- **Native Asset Packaging**: `assets/bible.db` is packaged as a binary asset outside the Hermes JS bundle, keeping the JS bundle at ~3.1–3.4 MB.
- **Expo SDK 58 & Expo Go Support**: `expo-sqlite` is built into Expo Go and supported in Android and iOS production builds.

## 2. Why JSON Was Not Retained as Runtime Storage
- Importing 75 MB of JSON via `require()` inlined all text into a **94 MB Hermes JS bundle**, causing slow downloads and timeouts in Expo Go.
- Parsing 10–11 MB JSON files (`malayalam`, `burmese`) on the JS thread allocates large objects on the mobile JS heap.

## 3. Database Schema
Built by `scripts/build-bible-db.py` into `assets/bible.db` (~88.79 MB, 926 books, 433,719 verses):

```sql
CREATE TABLE db_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
) WITHOUT ROWID;

CREATE TABLE books (
  translation TEXT NOT NULL,
  book_order INTEGER NOT NULL,
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  native_name TEXT,
  chapter_count INTEGER NOT NULL,
  PRIMARY KEY (translation, slug)
) WITHOUT ROWID;

CREATE INDEX idx_books_order ON books(translation, book_order);

CREATE TABLE verses (
  translation TEXT NOT NULL,
  book TEXT NOT NULL,
  chapter INTEGER NOT NULL,
  verse INTEGER NOT NULL,
  text TEXT NOT NULL,
  PRIMARY KEY (translation, book, chapter, verse)
) WITHOUT ROWID;
```

## 4. Database Initialization (`src/lib/bible.ts`)
- `initializeBibleDatabase()` uses a singleton `dbPromise` for concurrency-safe initialization across all screens.
- Eagerly triggered in `src/app/_layout.tsx` on app startup.
- On subsequent launches where `AsyncStorage` `bible_db_installed_version` matches `BIBLE_DATABASE_VERSION`, the existing database in `expo-sqlite`'s persistent directory is opened directly without overwriting.
- Opened with `PRAGMA query_only = ON;` so bundled Bible content remains strictly read-only.

## 5. Database Versioning
- `BIBLE_SCHEMA_VERSION = '1'`
- `BIBLE_CONTENT_VERSION = '2026.11.1'`
- `BIBLE_DATABASE_VERSION = '1.0.0'`
- Stored both in `db_meta` inside `assets/bible.db` and in `AsyncStorage` (`bible_db_installed_version`).

## 6. Translation Registry (`src/lib/translations.ts`)
- `TRANSLATION_REGISTRY` explicitly registers all 15 translations with `id`, `displayName`, `nativeName`, `language`, `flag`, `dir`, `translation`, `booksCount`, `firstBook`, `dbIdentifier`, `originalFilename`, and `available`.
- `normalizeTranslationId()` ensures UI display names are never used as DB identifiers.

## 7. Chapter Retrieval
- `getChapterData(bookParam, chapterParam, langParam)` queries `books` and `verses` from SQLite using parameterized queries.
- Computes `prevChapter` and `nextChapter` (including cross-book transitions such as `Genesis 50 -> Exodus 1`, `Exodus 40 -> Leviticus 1`, and reverse) from SQLite `books` rows.
- `src/app/reader/[book]/[chapter].tsx` uses an `active` cancellation guard to prevent stale async results during rapid navigation.

## 8. Search Architecture
- `bibleDataService.searchVerses(translation, query, limit = 50, offset = 0)` executes parameterized `LIKE` queries with pagination (`LIMIT ? OFFSET ?`).
- FTS5 was evaluated and deferred for a future release because all 15 scripts (Hebrew, Syriac, Malayalam, Burmese, Chinese, Greek, Cyrillic, Latin) are already searchable via UTF-8 `LIKE` without increasing DB size.

## 9. User-Data Separation
- User preferences, bookmarks, font size, and audio settings are stored in `AsyncStorage` (`src/lib/preferences.ts`, `src/lib/audio.ts`), completely separate from `bible_offline_v1.db`.
- Bible DB updates never touch `AsyncStorage` user bookmarks or settings.

## 10. Offline Behavior
- Zero `fetch()` calls for Bible content anywhere in `src/`.
- Works 100% in airplane mode immediately after installation and across force-close/restarts.

## 11. Expo Go Compatibility
- `metro.config.js` adds `'db'` to `resolver.assetExts`.
- `expo-sqlite` and `expo-asset` are bundled in Expo Go SDK 58.

## 12. Android & 13. iOS Packaging
- `app.json` configures `android.package: "in.ciyo.bible"` and `ios.bundleIdentifier: "in.ciyo.bible"`, with `expo-sqlite` and `expo-asset` plugins.
- `npx expo export --platform android` produces a **3.4 MB** Hermes bundle + `assets/bible.db`.
- `npx expo export --platform ios` produces a **3.1 MB** Hermes bundle + `assets/bible.db`.

## 14. Database Update Strategy
When a future app update increments `BIBLE_DATABASE_VERSION`:
1. `initializeBibleDatabase()` imports the new bundled `assets/bible.db` into `bible_offline_tmp.db`.
2. Verifies `db_meta` and `verses` integrity on `bible_offline_tmp.db`.
3. Replaces `bible_offline_v1.db` only after verification succeeds, deletes the temporary DB, and updates `bible_db_installed_version` in `AsyncStorage` without affecting user bookmarks or preferences.
