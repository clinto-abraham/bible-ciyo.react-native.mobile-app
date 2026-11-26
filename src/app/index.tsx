import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  BookMeta,
  GOSPELS_SLUGS,
  NEVIIM_SLUGS,
  NT_BOOKS,
  TORAH_SLUGS,
  getBooks,
  getLanguages,
} from '@/lib/bible';
import {
  getPreferredLanguage,
  setPreferredLanguage,
  subscribePreferredLanguage,
} from '@/lib/preferences';
import { Palette } from '@/constants/palette';
import AppHeader from '@/components/AppHeader';
import PassageSelector from '@/components/PassageSelector';
import LanguageCard from '@/components/LanguageCard';

const FEATURES = [
  {
    icon: 'flash-outline' as const,
    color: Palette.sky,
    bg: 'rgba(56, 189, 248, 0.12)',
    border: 'rgba(56, 189, 248, 0.28)',
    title: 'Single-Chapter Streaming',
    desc: 'Loads one chapter at a time with offline caching so memory stays tiny.',
    tag: 'Fast & Cached',
  },
  {
    icon: 'pulse-outline' as const,
    color: Palette.amber,
    bg: 'rgba(245, 158, 11, 0.12)',
    border: 'rgba(245, 158, 11, 0.28)',
    title: 'Waving Shimmer',
    desc: 'Calming shimmer skeletons keep layout steady while chapters load.',
    tag: 'Fluid UI',
  },
  {
    icon: 'library-outline' as const,
    color: Palette.indigo,
    bg: 'rgba(99, 102, 241, 0.12)',
    border: 'rgba(99, 102, 241, 0.28)',
    title: '15 Sacred Codices',
    desc: 'Hebrew WLC, Greek TR, Syriac Peshitta, Latin, KJV, BSB, Malayalam & more.',
    tag: '15 Editions',
  },
  {
    icon: 'search-outline' as const,
    color: Palette.emeraldLight,
    bg: 'rgba(16, 185, 129, 0.12)',
    border: 'rgba(16, 185, 129, 0.28)',
    title: 'Lexical Modal',
    desc: 'Tap the info icon on any verse for transliteration, roots & parallel texts.',
    tag: 'Morphology',
  },
];

export default function HomeScreen() {
  const [currentLang, setCurrentLang] = useState('english');
  const languages = useMemo(() => getLanguages(), []);
  const books = useMemo(() => getBooks(currentLang), [currentLang]);

  useEffect(() => {
    getPreferredLanguage().then(setCurrentLang);
    return subscribePreferredLanguage(setCurrentLang);
  }, []);

  const handleSelectLang = async (langId: string) => {
    setCurrentLang(langId);
    await setPreferredLanguage(langId);
  };

  const navigateToReader = (bookSlug: string, chapter: number, verse?: number) => {
    router.push({
      pathname: '/reader/[book]/[chapter]',
      params: {
        book: bookSlug,
        chapter: String(chapter),
        lang: currentLang,
        ...(verse ? { verse: String(verse) } : {}),
      },
    });
  };

  const isHebrew = currentLang === 'hebrew';
  const isGreek = currentLang === 'greek';
  const isAramaic = currentLang === 'aramaic';

  const torahBooks = books.filter((b) => TORAH_SLUGS.includes(b.slug));
  const neviimBooks = books.filter((b) => NEVIIM_SLUGS.includes(b.slug));
  const ketuvimBooks = books.filter(
    (b) => !TORAH_SLUGS.includes(b.slug) && !NEVIIM_SLUGS.includes(b.slug)
  );
  const gospels = books.filter((b) => GOSPELS_SLUGS.includes(b.slug));
  const epistles = books.filter(
    (b) => NT_BOOKS.includes(b.slug) && !GOSPELS_SLUGS.includes(b.slug)
  );
  const otBooks = books.filter((b) => !NT_BOOKS.includes(b.slug));
  const ntBooks = books.filter((b) => NT_BOOKS.includes(b.slug));

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <AppHeader
        currentLang={currentLang}
        languages={languages}
        onSelectLang={handleSelectLang}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroPill}>
            <Text style={styles.heroPillPurple}>MULTI-LANGUAGE SCRIPTURES</Text>
            <Text style={styles.heroPillDot}>•</Text>
            <Text style={styles.heroPillMuted}>CIYO.IN</Text>
          </View>

          <Text style={styles.heroTitle}>
            The Living Word in{' '}
            <Text style={{ color: Palette.sky }}>Ancient Tongues</Text>
            {' & '}
            <Text style={{ color: Palette.gold }}>Sacred Codices</Text>
          </Text>

          <Text style={styles.heroDesc}>
            Lightweight reader streaming one chapter at a time with shimmer skeletons,
            multi-lingual audio, and lexical translation history.
          </Text>
        </View>

        {/* Passage Selector */}
        <PassageSelector
          currentLang={currentLang}
          books={books}
          onNavigate={navigateToReader}
        />

        {/* Features 2x2 Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionHeading}>Reverence, Speed & Scholarly Depth</Text>
          <View style={styles.grid2}>
            {FEATURES.map((f) => (
              <View key={f.title} style={styles.featureCard}>
                <View style={[styles.featureIconWrap, { backgroundColor: f.bg, borderColor: f.border }]}>
                  <Ionicons name={f.icon} size={18} color={f.color} />
                </View>
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureDesc}>{f.desc}</Text>
                <Text style={[styles.featureTag, { color: f.color }]}>{f.tag}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 15 Translation Editions */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionKicker}>SELECT EDITION</Text>
            <Text style={styles.sectionCount}>{languages.length} Codices</Text>
          </View>
          <View style={styles.grid2}>
            {languages.map((l) => (
              <View key={l.id} style={styles.grid2Item}>
                <LanguageCard
                  language={l}
                  isSelected={l.id === currentLang}
                  onSelect={handleSelectLang}
                />
              </View>
            ))}
          </View>
        </View>

        {/* Books Catalog */}
        <View style={styles.section}>
          {isHebrew ? (
            <>
              <BookGroup title="תּוֹרָה • Torah (5)" books={torahBooks} lang={currentLang} onOpen={navigateToReader} />
              <BookGroup title="נְבִיאִים • Nevi'im (21)" books={neviimBooks} lang={currentLang} onOpen={navigateToReader} />
              <BookGroup title="כְּתוּבִים • Ketuvim (13)" books={ketuvimBooks} lang={currentLang} onOpen={navigateToReader} />
            </>
          ) : isGreek ? (
            <>
              <BookGroup title="Εὐαγγέλια • Gospels & Acts (5)" books={gospels} lang={currentLang} onOpen={navigateToReader} />
              <BookGroup title="Ἐπιστολαί • Epistles & Apocalypse (22)" books={epistles} lang={currentLang} onOpen={navigateToReader} />
            </>
          ) : isAramaic ? (
            <>
              <BookGroup title="ܐܘܢܓܠܝܘܢ • Gospels & Acts (5)" books={gospels} lang={currentLang} onOpen={navigateToReader} />
              <BookGroup title="ܐܓܪ̈ܬܐ • Epistles & Apocalypse (22)" books={epistles} lang={currentLang} onOpen={navigateToReader} />
            </>
          ) : (
            <>
              <BookGroup title={`Old Testament (${otBooks.length})`} books={otBooks} lang={currentLang} onOpen={navigateToReader} />
              {ntBooks.length > 0 && (
                <BookGroup title={`New Testament (${ntBooks.length})`} books={ntBooks} lang={currentLang} onOpen={navigateToReader} />
              )}
            </>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Sacred Scriptures • ciyo.in</Text>
          <Pressable onPress={() => router.push('/about')}>
            <Text style={styles.footerLink}>About & Sources</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function BookGroup({
  title,
  books,
  lang,
  onOpen,
}: {
  title: string;
  books: BookMeta[];
  lang: string;
  onOpen: (slug: string, chapter: number) => void;
}) {
  const isRtl = lang === 'hebrew' || lang === 'aramaic';
  return (
    <View style={styles.groupWrap}>
      <View style={styles.groupHeader}>
        <Text style={styles.groupTitle}>{title}</Text>
      </View>
      <View style={styles.grid2}>
        {books.map((b) => (
          <View key={b.slug} style={styles.grid2Item}>
            <Pressable
              onPress={() => onOpen(b.slug, 1)}
              style={({ pressed }) => [styles.bookCard, pressed && { opacity: 0.85 }]}
            >
              {b.nativeName ? (
                <Text
                  style={[styles.bookNative, { textAlign: isRtl ? 'right' : 'left' }]}
                  numberOfLines={1}
                >
                  {b.nativeName}
                </Text>
              ) : null}
              <Text style={styles.bookName} numberOfLines={1}>
                {b.name}
              </Text>
              <Text style={styles.bookCh}>
                {b.chapterCount} {b.chapterCount === 1 ? 'ch' : 'chs'}
              </Text>
            </Pressable>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Palette.bgBase,
  },
  scrollContent: {
    paddingHorizontal: 14,
    paddingTop: 18,
    paddingBottom: 42,
    gap: 24,
  },
  hero: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 6,
  },
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: Palette.bgCard,
    borderWidth: 1,
    borderColor: Palette.borderSubtle,
  },
  heroPillPurple: {
    color: Palette.sky,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  heroPillDot: {
    color: Palette.textDim,
  },
  heroPillMuted: {
    color: Palette.textMuted,
    fontSize: 10,
    fontWeight: '600',
  },
  heroTitle: {
    color: Palette.textWhite,
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 36,
  },
  heroDesc: {
    color: Palette.textMuted,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  section: {
    gap: 12,
  },
  sectionHeading: {
    color: Palette.textWhite,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionKicker: {
    color: Palette.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  sectionCount: {
    color: Palette.textDim,
    fontSize: 11,
  },
  grid2: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  grid2Item: {
    width: '48.5%',
  },
  featureCard: {
    width: '48.5%',
    padding: 13,
    borderRadius: 20,
    backgroundColor: 'rgba(15, 23, 42, 0.58)',
    borderWidth: 1,
    borderColor: Palette.borderSubtle,
    gap: 6,
  },
  featureIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  featureTitle: {
    color: Palette.textWhite,
    fontSize: 13,
    fontWeight: '700',
  },
  featureDesc: {
    color: Palette.textMuted,
    fontSize: 11,
    lineHeight: 16,
  },
  featureTag: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  groupWrap: {
    gap: 10,
    marginBottom: 14,
  },
  groupHeader: {
    borderBottomWidth: 1,
    borderBottomColor: Palette.borderSubtle,
    paddingBottom: 8,
  },
  groupTitle: {
    color: Palette.textWhite,
    fontSize: 17,
    fontWeight: '700',
  },
  bookCard: {
    padding: 13,
    borderRadius: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    borderWidth: 1,
    borderColor: Palette.borderSubtle,
    justifyContent: 'space-between',
    minHeight: 84,
  },
  bookNative: {
    color: Palette.textWhite,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  bookName: {
    color: Palette.textSlate300,
    fontSize: 12,
    fontWeight: '500',
  },
  bookCh: {
    color: Palette.textDim,
    fontSize: 10,
    marginTop: 8,
  },
  footer: {
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: Palette.borderSubtle,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerText: {
    color: Palette.textDim,
    fontSize: 11,
  },
  footerLink: {
    color: Palette.sky,
    fontSize: 11,
    fontWeight: '600',
  },
});
