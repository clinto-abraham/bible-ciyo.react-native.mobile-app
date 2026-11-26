import json
import os
import sqlite3

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE, "assets", "bible.db")
BOOKS_DIR = os.path.join(BASE, "src", "data", "books")
NEXTJS_DATA = os.path.abspath(os.path.join(BASE, "..", "bible.ciyo.in", "public", "data"))

EXPECTED_TRANSLATIONS = [
    "hebrew", "english", "english-bsb", "english-ylt", "malayalam",
    "greek", "aramaic", "latin", "german", "french",
    "spanish", "russian", "chinese", "burmese", "slavic",
]

def main():
    assert os.path.exists(DB_PATH), f"Missing {DB_PATH}"
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    # 1. Verify db_meta versioning
    meta = dict(cur.execute("SELECT key, value FROM db_meta").fetchall())
    assert meta.get("schema_version") == "1", f"Unexpected schema_version: {meta}"
    assert meta.get("content_version") == "2026.11.1", f"Unexpected content_version: {meta}"
    assert meta.get("database_version") == "1.0.0", f"Unexpected database_version: {meta}"
    print(f"[PASS] db_meta verified: {meta}")

    # 2. Verify query plan uses clustered PRIMARY KEY
    plan = cur.execute(
        "EXPLAIN QUERY PLAN SELECT verse, text FROM verses WHERE translation = ? AND book = ? AND chapter = ? ORDER BY verse ASC",
        ("english", "genesis", 1),
    ).fetchall()
    plan_str = " ".join(str(p) for p in plan)
    assert "PRIMARY KEY" in plan_str, f"Query plan not using primary key: {plan_str}"
    print(f"[PASS] Query plan verified: {plan_str}")

    # 3. Verify all 15 translations
    db_langs = sorted(r[0] for r in cur.execute("SELECT DISTINCT translation FROM verses").fetchall())
    assert sorted(EXPECTED_TRANSLATIONS) == db_langs, f"Mismatch: {db_langs}"
    print(f"[PASS] All {len(db_langs)} translations present in bible.db")

    for lang in EXPECTED_TRANSLATIONS:
        with open(os.path.join(BOOKS_DIR, f"{lang}.json"), "r", encoding="utf-8") as f:
            books_json = json.load(f)

        db_books = cur.execute(
            "SELECT slug, chapter_count FROM books WHERE translation = ? ORDER BY book_order ASC",
            (lang,),
        ).fetchall()
        assert len(db_books) == len(books_json), f"{lang}: books count mismatch"

        slugs = [b[0] for b in db_books]
        ch_counts = {b[0]: b[1] for b in db_books}
        has_ot = "genesis" in ch_counts
        has_nt = "matthew" in ch_counts

        if has_ot:
            for b, ch in [
                ("genesis", 1), ("genesis", 2), ("genesis", 50),
                ("exodus", 1), ("exodus", 2), ("exodus", 40),
                ("leviticus", 1), ("psalms", 119),
            ]:
                rows = cur.execute(
                    "SELECT verse, text FROM verses WHERE translation = ? AND book = ? AND chapter = ? ORDER BY verse ASC",
                    (lang, b, ch),
                ).fetchall()
                assert len(rows) > 0, f"{lang} missing {b} {ch}"
                assert rows[0][0] == 1, f"{lang} {b} {ch} first verse != 1"
                assert rows[-1][0] == len(rows), f"{lang} {b} {ch} non-contiguous verses"

            # Cross-book navigation checks: Genesis 50 -> Exodus 1, Exodus 40 -> Leviticus 1
            gen_idx = slugs.index("genesis")
            exo_idx = slugs.index("exodus")
            lev_idx = slugs.index("leviticus")
            assert slugs[gen_idx + 1] == "exodus" and ch_counts["genesis"] == 50
            assert slugs[exo_idx + 1] == "leviticus" and ch_counts["exodus"] == 40
            assert slugs[lev_idx - 1] == "exodus"

        if has_nt:
            for b, ch in [("matthew", 1), ("matthew", 2), ("romans", 8), ("revelation", 22)]:
                rows = cur.execute(
                    "SELECT verse, text FROM verses WHERE translation = ? AND book = ? AND chapter = ? ORDER BY verse ASC",
                    (lang, b, ch),
                ).fetchall()
                assert len(rows) > 0, f"{lang} missing {b} {ch}"
                assert rows[0][0] == 1, f"{lang} {b} {ch} first verse != 1"
                assert rows[-1][0] == len(rows), f"{lang} {b} {ch} non-contiguous verses"

        # Spot-check against Next.js source JSON
        sample_book = "genesis" if has_ot else "matthew"
        nextjs_ch_path = os.path.join(NEXTJS_DATA, lang, "bible", sample_book, "2.json")
        if not os.path.exists(nextjs_ch_path):
            nextjs_ch_path = os.path.join(NEXTJS_DATA, lang, sample_book, "2.json")
        if os.path.exists(nextjs_ch_path):
            with open(nextjs_ch_path, "r", encoding="utf-8") as nf:
                nj = json.load(nf)
            db_rows = cur.execute(
                "SELECT verse, text FROM verses WHERE translation = ? AND book = ? AND chapter = 2 ORDER BY verse ASC",
                (lang, sample_book),
            ).fetchall()
            assert len(db_rows) == len(nj["verses"]), f"{lang} {sample_book} 2 count mismatch"
            assert db_rows[0][1] == nj["verses"][0]["text"], f"{lang} {sample_book} 2 text mismatch"
            assert db_rows[-1][1] == nj["verses"][-1]["text"], f"{lang} {sample_book} 2 last verse mismatch"

        print(f"[PASS] {lang}: {len(db_books)} books verified (OT={has_ot}, NT={has_nt})")

    conn.close()
    print("ALL 15 OFFLINE TRANSLATIONS & NAVIGATION INVARIANTS VERIFIED.")

if __name__ == "__main__":
    main()
