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
import { BookMeta } from '@/lib/bible';
import { Palette } from '@/constants/palette';
import BookPickerModal from './BookPickerModal';

interface PassageSelectorProps {
  currentLang: string;
  books: BookMeta[];
  onNavigate: (bookSlug: string, chapter: number, verse?: number) => void;
}

export default function PassageSelector({
  currentLang,
  books,
  onNavigate,
}: PassageSelectorProps) {
  const startBook = currentLang === 'greek' || currentLang === 'aramaic' ? 'matthew' : 'genesis';

  const [selectedBookSlug, setSelectedBookSlug] = useState(startBook);
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [selectedVerse, setSelectedVerse] = useState(1);

  const [pickerType, setPickerType] = useState<'book' | 'chapter' | 'verse' | null>(null);
  const [search, setSearch] = useState('');

  const selectedBook = useMemo(() => {
    return books.find((b) => b.slug === selectedBookSlug) || books[0];
  }, [books, selectedBookSlug]);

  const maxChapters = selectedBook?.chapterCount || 50;

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

  const filteredChapters = useMemo(() => {
    const all = Array.from({ length: maxChapters }, (_, i) => i + 1);
    const q = search.trim();
    if (!q) return all;
    return all.filter((c) => String(c).includes(q));
  }, [maxChapters, search]);

  const filteredVerses = useMemo(() => {
    const all = Array.from({ length: 50 }, (_, i) => i + 1);
    const q = search.trim();
    if (!q) return all;
    return all.filter((v) => String(v).includes(q));
  }, [search]);

  const openPicker = (type: 'book' | 'chapter' | 'verse') => {
    setSearch('');
    setPickerType(type);
  };

  return (
    <View style={styles.container}>
      {/* Primary CTA Button */}
      <Pressable
        onPress={() => onNavigate(startBook, 1)}
        style={({ pressed }) => [styles.ctaBtn, pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
      >
        <Ionicons name="book-outline" size={20} color={Palette.textWhite} />
        <Text style={styles.ctaText}>READ BIBLE NOW</Text>
        <View style={styles.ctaPill}>
          <Text style={styles.ctaPillText}>
            {startBook === 'matthew' ? 'Matt 1' : 'Gen 1'}
          </Text>
        </View>
        <Ionicons name="arrow-forward" size={18} color={Palette.textWhite} />
      </Pressable>

      {/* Quick Passage Navigator Card */}
      <View style={styles.navCard}>
        <View style={styles.navHeader}>
          <View style={styles.navTitleRow}>
            <Ionicons name="flash" size={14} color={Palette.sky} />
            <Text style={styles.navTitle}>QUICK PASSAGE NAVIGATOR</Text>
          </View>
          <Ionicons name="compass-outline" size={16} color={Palette.textDim} />
        </View>

        {/* Book Picker Trigger */}
        <Pressable onPress={() => openPicker('book')} style={styles.selectBox}>
          <View style={{ flex: 1 }}>
            <Text style={styles.selectLabel}>BOOK</Text>
            <Text style={styles.selectValue} numberOfLines={1}>
              {selectedBook?.name || 'Genesis'}
              {selectedBook?.nativeName && selectedBook.nativeName !== selectedBook.name
                ? ` (${selectedBook.nativeName})`
                : ''}
            </Text>
          </View>
          <Ionicons name="chevron-down" size={16} color={Palette.textMuted} />
        </Pressable>

        {/* Chapter + Verse + Go Row */}
        <View style={styles.row}>
          <Pressable onPress={() => openPicker('chapter')} style={[styles.selectBox, { flex: 1 }]}>
            <View>
              <Text style={styles.selectLabel}>CH</Text>
              <Text style={styles.selectValue}>{selectedChapter}</Text>
            </View>
            <Ionicons name="chevron-down" size={14} color={Palette.textMuted} />
          </Pressable>

          <Pressable onPress={() => openPicker('verse')} style={[styles.selectBox, { flex: 1 }]}>
            <View>
              <Text style={styles.selectLabel}>VERSE</Text>
              <Text style={styles.selectValue}>{selectedVerse}</Text>
            </View>
            <Ionicons name="chevron-down" size={14} color={Palette.textMuted} />
          </Pressable>

          <Pressable
            onPress={() => onNavigate(selectedBook?.slug || startBook, selectedChapter, selectedVerse)}
            style={({ pressed }) => [styles.goBtn, pressed && { opacity: 0.85 }]}
          >
            <Text style={styles.goText}>Go</Text>
            <Ionicons name="arrow-forward" size={15} color={Palette.textWhite} />
          </Pressable>
        </View>
      </View>

      {/* Book Searchable Picker with Old & New Testament Split */}
      <BookPickerModal
        visible={pickerType === 'book'}
        books={books}
        selectedBookSlug={selectedBookSlug}
        onSelect={(slug) => {
          setSelectedBookSlug(slug);
          setSelectedChapter(1);
        }}
        onClose={() => setPickerType(null)}
      />

      {/* Chapter / Verse Number Picker Modal */}
      <Modal
        visible={pickerType === 'chapter' || pickerType === 'verse'}
        transparent
        animationType="slide"
        onRequestClose={() => setPickerType(null)}
      >
        <Pressable style={styles.backdrop} onPress={() => setPickerType(null)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>
                {pickerType === 'chapter'
                  ? `Select Chapter (${selectedBook?.name})`
                  : 'Select Verse'}
              </Text>
              <Pressable onPress={() => setPickerType(null)} style={styles.closeBtn}>
                <Ionicons name="close" size={18} color={Palette.textSlate300} />
              </Pressable>
            </View>

            <View style={styles.searchBox}>
              <Ionicons name="search" size={16} color={Palette.textMuted} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Filter number..."
                placeholderTextColor={Palette.textDim}
                keyboardType="number-pad"
                style={styles.searchInput}
              />
            </View>

            <FlatList
              data={pickerType === 'chapter' ? filteredChapters : filteredVerses}
              numColumns={5}
              keyExtractor={(n) => String(n)}
              columnWrapperStyle={{ gap: 8, marginBottom: 8 }}
              renderItem={({ item }) => {
                const active =
                  pickerType === 'chapter' ? item === selectedChapter : item === selectedVerse;
                return (
                  <Pressable
                    onPress={() => {
                      if (pickerType === 'chapter') setSelectedChapter(item);
                      else setSelectedVerse(item);
                      setPickerType(null);
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 999,
    backgroundColor: Palette.blue600,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.45)',
    shadowColor: Palette.blue,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  ctaText: {
    color: Palette.textWhite,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
  },
  ctaPill: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  ctaPillText: {
    color: Palette.amberLight,
    fontSize: 11,
    fontWeight: '700',
  },
  navCard: {
    padding: 16,
    borderRadius: 24,
    backgroundColor: 'rgba(15, 23, 42, 0.78)',
    borderWidth: 1,
    borderColor: Palette.borderSubtle,
    gap: 10,
  },
  navHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Palette.borderSubtle,
    paddingBottom: 8,
  },
  navTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  navTitle: {
    color: Palette.textSlate300,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  selectBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: Palette.bgBase,
    borderWidth: 1,
    borderColor: Palette.borderHover,
  },
  selectLabel: {
    color: Palette.textDim,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  selectValue: {
    color: Palette.textWhite,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 1,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'stretch',
  },
  goBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 18,
    borderRadius: 14,
    backgroundColor: Palette.indigo600,
  },
  goText: {
    color: Palette.textWhite,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
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
    maxHeight: '78%',
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
