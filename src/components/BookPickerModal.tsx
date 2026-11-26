import { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BookMeta, NT_BOOKS } from '@/lib/bible';
import { Palette } from '@/constants/palette';

type TestamentFilter = 'all' | 'ot' | 'nt';

interface BookPickerModalProps {
  visible: boolean;
  books: BookMeta[];
  selectedBookSlug: string;
  onSelect: (bookSlug: string) => void;
  onClose: () => void;
}

export default function BookPickerModal({
  visible,
  books,
  selectedBookSlug,
  onSelect,
  onClose,
}: BookPickerModalProps) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<TestamentFilter>('all');

  const hasOt = useMemo(() => books.some((b) => !NT_BOOKS.includes(b.slug)), [books]);
  const hasNt = useMemo(() => books.some((b) => NT_BOOKS.includes(b.slug)), [books]);

  const sections = useMemo(() => {
    const q = search.trim().toLowerCase();
    const matches = books.filter((b) => {
      if (!q) return true;
      return (
        b.name.toLowerCase().includes(q) ||
        (b.nativeName && b.nativeName.toLowerCase().includes(q)) ||
        b.slug.toLowerCase().includes(q)
      );
    });

    const ot = matches.filter((b) => !NT_BOOKS.includes(b.slug));
    const nt = matches.filter((b) => NT_BOOKS.includes(b.slug));

    const result: Array<{ title: string; count: number; data: BookMeta[] }> = [];
    if ((filter === 'all' || filter === 'ot') && ot.length > 0) {
      result.push({ title: 'Old Testament', count: ot.length, data: ot });
    }
    if ((filter === 'all' || filter === 'nt') && nt.length > 0) {
      result.push({ title: 'New Testament', count: nt.length, data: nt });
    }
    return result;
  }, [books, search, filter]);

  const handleClose = () => {
    setSearch('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Select Book</Text>
            <Pressable onPress={handleClose} style={styles.closeBtn} accessibilityLabel="Close">
              <Ionicons name="close" size={18} color={Palette.textSlate300} />
            </Pressable>
          </View>

          {/* Search Input */}
          <View style={styles.searchBox}>
            <Ionicons name="search" size={16} color={Palette.textMuted} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search book (e.g. Gen, Matt)..."
              placeholderTextColor={Palette.textDim}
              style={styles.searchInput}
              autoCorrect={false}
            />
            {search.length > 0 && (
              <Pressable onPress={() => setSearch('')} hitSlop={8}>
                <Ionicons name="close-circle" size={16} color={Palette.textMuted} />
              </Pressable>
            )}
          </View>

          {/* Old / New Testament Filter Tabs */}
          {hasOt && hasNt && (
            <View style={styles.tabsRow}>
              {(
                [
                  { id: 'all', label: 'All' },
                  { id: 'ot', label: 'Old Testament' },
                  { id: 'nt', label: 'New Testament' },
                ] as const
              ).map((tab) => {
                const active = filter === tab.id;
                return (
                  <Pressable
                    key={tab.id}
                    onPress={() => setFilter(tab.id)}
                    style={[styles.tabPill, active && styles.tabPillActive]}
                  >
                    <Text style={[styles.tabText, active && styles.tabTextActive]}>
                      {tab.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}

          {/* Grouped Old / New Testament List */}
          <SectionList
            sections={sections}
            keyExtractor={(item) => item.slug}
            keyboardShouldPersistTaps="handled"
            stickySectionHeadersEnabled={false}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No matching books found</Text>
            }
            renderSectionHeader={({ section }) => (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                <Text style={styles.sectionCount}>{section.count}</Text>
              </View>
            )}
            renderItem={({ item }) => {
              const active = item.slug === selectedBookSlug;
              return (
                <Pressable
                  onPress={() => {
                    setSearch('');
                    onSelect(item.slug);
                    onClose();
                  }}
                  style={[styles.bookRow, active && styles.bookRowActive]}
                >
                  <Text style={styles.bookRowName} numberOfLines={1}>
                    {item.name}
                    {item.nativeName && item.nativeName !== item.name
                      ? ` (${item.nativeName})`
                      : ''}
                  </Text>
                  <Text style={styles.bookRowCh}>{item.chapterCount} ch</Text>
                </Pressable>
              );
            }}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
    maxHeight: '82%',
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
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    color: Palette.textWhite,
    fontSize: 14,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  tabPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: Palette.bgBase,
    borderWidth: 1,
    borderColor: Palette.borderSubtle,
    alignItems: 'center',
  },
  tabPillActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.16)',
    borderColor: Palette.sky,
  },
  tabText: {
    color: Palette.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  tabTextActive: {
    color: Palette.sky,
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 4,
    marginTop: 4,
    borderBottomWidth: 1,
    borderBottomColor: Palette.borderSubtle,
    marginBottom: 6,
  },
  sectionTitle: {
    color: Palette.amberLight,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
  },
  sectionCount: {
    color: Palette.textDim,
    fontSize: 11,
    fontWeight: '600',
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
  emptyText: {
    color: Palette.textDim,
    textAlign: 'center',
    paddingVertical: 24,
    fontSize: 13,
  },
});
