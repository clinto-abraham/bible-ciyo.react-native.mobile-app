import json
import os
import sqlite3

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE, "assets", "bible.db")
BOOKS_DIR = os.path.join(BASE, "src", "data", "books")
NEXTJS_DATA = os.path.abspath(os.path.join(BASE, "..", "bible.ciyo.in", "public", "data"))

BIBLE_SCHEMA_VERSION = "1"
BIBLE_CONTENT_VERSION = "2026.11.1"
BIBLE_DATABASE_VERSION = "1.0.0"

TRANSLATIONS = [
    "hebrew", "english", "english-bsb", "english-ylt", "malayalam",
    "greek", "aramaic", "latin", "german", "french",
    "spanish", "russian", "chinese", "burmese", "slavic",
]

def main():
    tmp_db = DB_PATH + ".tmp"
    if os.path.exists(tmp_db):
        os.remove(tmp_db)

    conn = sqlite3.connect(tmp_db)
    cur = conn.cursor()

    cur.execute("""
    CREATE TABLE db_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    ) WITHOUT ROWID
    """)

    cur.execute("""
    CREATE TABLE books (
      translation TEXT NOT NULL,
      book_order INTEGER NOT NULL,
      slug TEXT NOT NULL,
      name TEXT NOT NULL,
      native_name TEXT,
      chapter_count INTEGER NOT NULL,
      PRIMARY KEY (translation, slug)
    ) WITHOUT ROWID
    """)

    cur.execute("CREATE INDEX idx_books_order ON books(translation, book_order)")

    cur.execute("""
    CREATE TABLE verses (
      translation TEXT NOT NULL,
      book TEXT NOT NULL,
      chapter INTEGER NOT NULL,
      verse INTEGER NOT NULL,
      text TEXT NOT NULL,
      PRIMARY KEY (translation, book, chapter, verse)
    ) WITHOUT ROWID
    """)

    cur.executemany("INSERT INTO db_meta VALUES (?, ?)", [
        ("schema_version", BIBLE_SCHEMA_VERSION),
        ("content_version", BIBLE_CONTENT_VERSION),
        ("database_version", BIBLE_DATABASE_VERSION),
    ])

    total_books = 0
    total_verses = 0

    for lang in TRANSLATIONS:
        books_json = os.path.join(BOOKS_DIR, f"{lang}.json")
        with open(books_json, "r", encoding="utf-8") as f:
            books = json.load(f)

        book_rows = []
        verse_rows = []

        for idx, b in enumerate(books, start=1):
            slug = b["slug"]
            ch_count = int(b["chapterCount"])
            book_rows.append((
                lang,
                idx,
                slug,
                b["name"],
                b.get("nativeName") or b.get("hebrewName") or "",
                ch_count,
            ))

            for ch in range(1, ch_count + 1):
                ch_path = os.path.join(NEXTJS_DATA, lang, "bible", slug, f"{ch}.json")
                if not os.path.exists(ch_path):
                    ch_path = os.path.join(NEXTJS_DATA, lang, slug, f"{ch}.json")
                if not os.path.exists(ch_path):
                    raise FileNotFoundError(f"Missing chapter file for {lang}/{slug}/{ch}")

                with open(ch_path, "r", encoding="utf-8") as cf:
                    ch_data = json.load(cf)

                for v in ch_data.get("verses", []):
                    verse_rows.append((lang, slug, ch, int(v["verse"]), v["text"]))

        cur.executemany("INSERT INTO books VALUES (?, ?, ?, ?, ?, ?)", book_rows)
        cur.executemany("INSERT INTO verses VALUES (?, ?, ?, ?, ?)", verse_rows)
        total_books += len(book_rows)
        total_verses += len(verse_rows)
        print(f"{lang}: {len(book_rows)} books, {len(verse_rows)} verses")

    conn.commit()
    cur.execute("VACUUM")
    conn.close()

    os.replace(tmp_db, DB_PATH)
    size_mb = os.path.getsize(DB_PATH) / (1024 * 1024)
    print(f"Built {DB_PATH}: {total_books} books, {total_verses} verses, {size_mb:.2f} MB")

if __name__ == "__main__":
    main()
