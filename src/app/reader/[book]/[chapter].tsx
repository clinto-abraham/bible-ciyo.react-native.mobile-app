import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  ChapterData,
  NT_BOOKS,
  getBooks,
  getChapterData,
  getLanguages,
  slugifyBook,
} from '@/lib/bible';
import { setPreferredLanguage } from '@/lib/preferences';
import { Palette } from '@/constants/palette';
import ChapterNav from '@/components/ChapterNav';
import ChapterReader from '@/components/ChapterReader';
import WavingSkeleton from '@/components/WavingSkeleton';

export default function ChapterScreen() {
  const params = useLocalSearchParams<{
    book?: string;
    chapter?: string;
    lang?: string;
    verse?: string;
  }>();

  const bookSlug = slugifyBook(params.book || 'genesis');
  const chapterNum = Number.parseInt(params.chapter || '1', 10) || 1;
  const activeLang = params.lang || 'english';
  const initialVerse = params.verse ? Number.parseInt(params.verse, 10) || null : null;

  const languages = useMemo(() => getLanguages(), []);
  const books = useMemo(() => getBooks(activeLang), [activeLang]);

  const [data, setData] = useState<ChapterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    getChapterData(bookSlug, chapterNum, activeLang)
      .then((res) => {
        if (!active) return;
        if (!res) {
          setError(`Chapter ${bookSlug} ${chapterNum} could not be loaded.`);
          setData(null);
        } else {
          setData(res);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err instanceof Error ? err.message : 'Failed to load chapter');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [bookSlug, chapterNum, activeLang]);

  const handleSelectLang = async (langId: string) => {
    await setPreferredLanguage(langId);
    let nextBook = bookSlug;
    let nextChapter = chapterNum;

    if (langId === 'greek' && !NT_BOOKS.includes(bookSlug)) {
      nextBook = 'matthew';
      nextChapter = 1;
    } else if (langId === 'aramaic' && !NT_BOOKS.includes(bookSlug) && bookSlug !== 'genesis') {
      nextBook = 'matthew';
      nextChapter = 1;
    } else if (langId === 'hebrew' && NT_BOOKS.includes(bookSlug)) {
      nextBook = 'genesis';
      nextChapter = 1;
    }

    router.replace({
      pathname: '/reader/[book]/[chapter]',
      params: {
        book: nextBook,
        chapter: String(nextChapter),
        lang: langId,
      },
    });
  };

  const handleNavigateChapter = (targetBook: string, targetChapter: number, verse?: number) => {
    router.replace({
      pathname: '/reader/[book]/[chapter]',
      params: {
        book: targetBook,
        chapter: String(targetChapter),
        lang: activeLang,
        ...(verse ? { verse: String(verse) } : {}),
      },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ChapterNav
        currentBook={data?.bookSlug || bookSlug}
        currentChapter={data?.chapterNumber || chapterNum}
        currentLang={activeLang}
        languages={languages}
        books={books}
        prevChapter={data?.prevChapter}
        nextChapter={data?.nextChapter}
        onSelectLang={handleSelectLang}
        onNavigateChapter={(b, c) => handleNavigateChapter(b, c)}
      />

      {loading ? (
        <View style={styles.loadingWrap}>
          <WavingSkeleton lines={6} />
        </View>
      ) : error || !data ? (
        <View style={styles.errorWrap}>
          <Ionicons name="book-outline" size={38} color={Palette.amber} />
          <Text style={styles.errorTitle}>Chapter Unavailable</Text>
          <Text style={styles.errorDesc}>
            {error || 'This chapter could not be found in the selected translation.'}
          </Text>
          <Pressable
            onPress={() => handleNavigateChapter(bookSlug, chapterNum)}
            style={styles.retryBtn}
          >
            <Ionicons name="refresh" size={16} color={Palette.textWhite} />
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <ChapterReader
          data={data}
          initialVerse={initialVerse}
          onJumpToBookmark={(b, c, v) => handleNavigateChapter(b, c, v)}
          ListHeaderComponent={
            <View style={styles.chapterHeader}>
              <View style={styles.transPill}>
                <View style={styles.pulseDot} />
                <Text style={styles.transText} numberOfLines={1}>
                  {data.translation}
                </Text>
              </View>

              <Text style={styles.chapterTitle}>
                {data.bookName}{' '}
                <Text style={{ color: Palette.gold }}>{data.chapterNumber}</Text>
              </Text>

              {data.nativeName && data.nativeName !== data.bookName ? (
                <Text style={styles.nativeTitle}>
                  {data.nativeName} {data.chapterNumber}
                </Text>
              ) : null}

              <View style={styles.divider} />
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Palette.bgBase,
  },
  loadingWrap: {
    flex: 1,
    paddingHorizontal: 14,
  },
  errorWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
    gap: 10,
  },
  errorTitle: {
    color: Palette.textWhite,
    fontSize: 18,
    fontWeight: '700',
  },
  errorDesc: {
    color: Palette.textMuted,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: Palette.blue600,
  },
  retryText: {
    color: Palette.textWhite,
    fontSize: 13,
    fontWeight: '700',
  },
  chapterHeader: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 6,
    gap: 8,
  },
  transPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: Palette.bgCard,
    borderWidth: 1,
    borderColor: Palette.borderSubtle,
    maxWidth: '92%',
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Palette.sky,
  },
  transText: {
    color: Palette.sky,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  chapterTitle: {
    color: Palette.textWhite,
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
  },
  nativeTitle: {
    color: Palette.textMuted,
    fontSize: 18,
    textAlign: 'center',
  },
  divider: {
    width: 72,
    height: 2,
    borderRadius: 2,
    backgroundColor: Palette.sky,
    marginTop: 6,
    opacity: 0.75,
  },
});
