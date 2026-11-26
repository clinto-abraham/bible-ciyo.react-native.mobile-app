import { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { BookMeta, LanguageMeta } from '@/lib/bible';
import { Palette } from '@/constants/palette';
import LanguagePickerModal from './LanguagePickerModal';
import BookPickerModal from './BookPickerModal';

interface ChapterNavProps {
  currentBook: string;
  currentChapter: number;
  currentLang: string;
  languages: LanguageMeta[];
  books: BookMeta[];
  prevChapter?: { book: string; chapter: number; lang?: string } | null;
  nextChapter?: { book: string; chapter: number; lang?: string } | null;
  onSelectLang: (langId: string) => void;
  onNavigateChapter: (bookSlug: string, chapter: number) => void;
}

export default function ChapterNav({
  currentBook,
  currentChapter,
  currentLang,
  languages,
  books,
  prevChapter,
  nextChapter,
  onSelectLang,
  onNavigateChapter,
}: ChapterNavProps) {
  const [langModalOpen, setLangModalOpen] = useState(false);
  const [pickerType, setPickerType] = useState<'book' | 'chapter' | null>(null);
  const [search, setSearch] = useState('');

  const activeLang = languages.find((l) => l.id === currentLang) || languages[0];
  const selectedBookMeta = books.find((b) => b.slug === currentBook) || books[0];
  const maxChapters = selectedBookMeta ? selectedBookMeta.chapterCount : 50;

  const filteredBooks = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return books;
    return books.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        (b.nativeName && b.nativeName.toLowerCase().includes(q)) ||
        b.slug.toLowerCase().includes(q)
    );
  }, [books, search]);

  const chaptersList = useMemo(
    () => Array.from({ length: maxChapters }, (_, i) => i + 1),
    [maxChapters]
  );

  return (
    <>
      <View style={styles.container}>
        {/* Row 1: Home / Brand + Language Switcher */}
        <View style={styles.topRow}>
          <Pressable
            onPress={() => router.push('/')}
            style={styles.brandRow}
            accessibilityLabel="Back to Home"
          >
            <View style={styles.emblemOuter}>
              <View style={styles.emblemInner}>
                <Text style={styles.cross}>✝</Text>
              </View>
            </View>
            <View>
              <Text style={styles.brandTitle}>Sacred Scriptures</Text>
              <Text style={styles.brandSub}>CIYO.IN OFFICIAL</Text>
            </View>
          </Pressable>

          <Pressable
            onPress={() => setLangModalOpen(true)}
            style={styles.langPill}
            accessibilityLabel="Switch language"
          >
            <Ionicons name="globe-outline" size={14} color={Palette.emeraldLight} />
            <Text style={styles.flag}>{activeLang?.flag || '🇬🇧'}</Text>
            <Text style={styles.langName} numberOfLines={1}>
              {activeLang?.name.split(' ')[0] || 'English'}
            </Text>
            <Ionicons name="chevron-down" size={13} color={Palette.textMuted} />
          </Pressable>
        </View>

        {/* Row 2: Prev | Book | Chapter | Next */}
        <View style={styles.navRow}>
          <Pressable
            disabled={!prevChapter}
            onPress={() =>
              prevChapter && onNavigateChapter(prevChapter.book, prevChapter.chapter)
            }
            style={[styles.arrowBtn, !prevChapter && styles.arrowBtnDisabled]}
            accessibilityLabel="Previous chapter"
          >
            <Ionicons
              name="chevron-back"
              size={16}
              color={prevChapter ? Palette.textSlate200 : Palette.textDim}
            />
          </Pressable>

          <Pressable
            onPress={() => {
              setSearch('');
              setPickerType('book');
            }}
            style={styles.bookPill}
          >
            <Text style={styles.pillText} numberOfLines={1}>
              {selectedBookMeta?.name || currentBook}
            </Text>
            <Ionicons name="chevron-down" size={13} color={Palette.textMuted} />
          </Pressable>

          <Pressable
            onPress={() => {
              setSearch('');
              setPickerType('chapter');
            }}
            style={styles.chPill}
          >
            <Text style={styles.pillText}>Ch {currentChapter}</Text>
            <Ionicons name="chevron-down" size={13} color={Palette.textMuted} />
          </Pressable>

          <Pressable
            disabled={!nextChapter}
            onPress={() =>
              nextChapter && onNavigateChapter(nextChapter.book, nextChapter.chapter)
            }
            style={[
              styles.arrowBtn,
              nextChapter ? styles.nextArrowBtn : styles.arrowBtnDisabled,
            ]}
            accessibilityLabel="Next chapter"
          >
            <Ionicons
              name="chevron-forward"
              size={16}
              color={nextChapter ? Palette.amberLight : Palette.textDim}
            />
          </Pressable>
        </View>
      </View>

      <LanguagePickerModal
        visible={langModalOpen}
        onClose={() => setLangModalOpen(false)}
        currentLang={currentLang}
        languages={languages}
        onSelect={onSelectLang}
      />

      {/* Book Picker Modal with Old & New Testament Split */}
      <BookPickerModal
        visible={pickerType === 'book'}
        books={books}
        selectedBookSlug={currentBook}
        onSelect={(slug) => onNavigateChapter(slug, 1)}
        onClose={() => setPickerType(null)}
      />

      {/* Chapter Picker Modal */}
      <Modal
        visible={pickerType === 'chapter'}
        transparent
        animationType="slide"
        onRequestClose={() => setPickerType(null)}
      >
        <Pressable style={styles.backdrop} onPress={() => setPickerType(null)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>
                Select Chapter ({selectedBookMeta?.name || currentBook})
              </Text>
              <Pressable onPress={() => setPickerType(null)} style={styles.closeBtn}>
                <Ionicons name="close" size={18} color={Palette.textSlate300} />
              </Pressable>
            </View>

            <FlatList
              data={chaptersList}
              numColumns={5}
              keyExtractor={(c) => String(c)}
              columnWrapperStyle={{ gap: 8, marginBottom: 8 }}
              renderItem={({ item }) => {
                const active = item === currentChapter;
                return (
                  <Pressable
                    onPress={() => {
                      setPickerType(null);
                      onNavigateChapter(currentBook, item);
                    }}
                    style={[styles.numCell, active && styles.numCellActive]}
                  >
                    <Text style={[styles.numCellText, active && styles.numCellTextActive]}>
                      {item}
                    </Text>
                  </Pressable>
                );
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(6, 8, 20, 0.94)',
    borderBottomWidth: 1,
    borderBottomColor: Palette.borderSubtle,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  emblemOuter: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Palette.blue600,
    borderWidth: 1.5,
    borderColor: Palette.amber,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emblemInner: {
    width: '100%',
    height: '100%',
    borderRadius: 13,
    backgroundColor: Palette.bgBase,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cross: {
    color: Palette.amber,
    fontSize: 12,
    fontWeight: '700',
  },
  brandTitle: {
    color: Palette.textWhite,
    fontSize: 13,
    fontWeight: '700',
  },
  brandSub: {
    color: Palette.textMuted,
    fontSize: 8.5,
    letterSpacing: 1.1,
    fontWeight: '600',
  },
  langPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: Palette.emerald,
    backgroundColor: Palette.bgCard,
  },
  flag: {
    fontSize: 13,
  },
  langName: {
    color: Palette.textWhite,
    fontSize: 11,
    fontWeight: '700',
    maxWidth: 70,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  arrowBtn: {
    width: 36,
    height: 34,
    borderRadius: 999,
    backgroundColor: Palette.bgCard,
    borderWidth: 1,
    borderColor: Palette.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextArrowBtn: {
    backgroundColor: 'rgba(37, 99, 235, 0.25)',
    borderColor: 'rgba(245, 158, 11, 0.45)',
  },
  arrowBtnDisabled: {
    opacity: 0.4,
  },
  bookPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: Palette.bgCard,
    borderWidth: 1,
    borderColor: Palette.borderSubtle,
  },
  chPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: Palette.bgCard,
    borderWidth: 1,
    borderColor: Palette.borderSubtle,
  },
  pillText: {
    color: Palette.textSlate100,
    fontSize: 12,
    fontWeight: '600',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Palette.bgDeep,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderColor: Palette.borderSubtle,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 28,
    maxHeight: '76%',
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sheetTitle: {
    color: Palette.textWhite,
    fontSize: 16,
    fontWeight: '700',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Palette.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Palette.bgBase,
    borderWidth: 1,
    borderColor: Palette.borderSubtle,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    color: Palette.textWhite,
    fontSize: 14,
  },
  bookRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: 12,
    marginBottom: 4,
  },
  bookRowActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.4)',
  },
  bookRowName: {
    color: Palette.textWhite,
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  bookRowCh: {
    color: Palette.textDim,
    fontSize: 11,
    marginLeft: 8,
  },
  numCell: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: Palette.bgBase,
    borderWidth: 1,
    borderColor: Palette.borderSubtle,
    alignItems: 'center',
  },
  numCellActive: {
    backgroundColor: Palette.amber,
    borderColor: Palette.amberLight,
  },
  numCellText: {
    color: Palette.textSlate200,
    fontSize: 13,
    fontWeight: '700',
  },
  numCellTextActive: {
    color: Palette.bgBase,
  },
});
