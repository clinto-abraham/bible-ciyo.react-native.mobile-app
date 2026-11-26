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
import { LanguageMeta } from '@/lib/bible';
import { Palette } from '@/constants/palette';

interface LanguagePickerModalProps {
  visible: boolean;
  onClose: () => void;
  currentLang: string;
  languages: LanguageMeta[];
  onSelect: (langId: string) => void;
}

export default function LanguagePickerModal({
  visible,
  onClose,
  currentLang,
  languages,
  onSelect,
}: LanguagePickerModalProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLanguages = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return languages;
    return languages.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.nativeName.toLowerCase().includes(q) ||
        l.translation.toLowerCase().includes(q)
    );
  }, [languages, searchQuery]);

  const handleChoose = (langId: string) => {
    setSearchQuery('');
    onSelect(langId);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Ionicons name="globe-outline" size={18} color={Palette.emeraldLight} />
              <Text style={styles.headerLabel}>SELECT LANGUAGE</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countText}>{languages.length}</Text>
              </View>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={8}>
              <Ionicons name="close" size={18} color={Palette.textMuted} />
            </Pressable>
          </View>

          {/* Search */}
          <View style={styles.searchWrap}>
            <Ionicons name="search" size={16} color={Palette.textMuted} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search languages..."
              placeholderTextColor={Palette.textDim}
              style={styles.searchInput}
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
                <Ionicons name="close-circle" size={16} color={Palette.textMuted} />
              </Pressable>
            )}
          </View>

          {/* List */}
          <FlatList
            data={filteredLanguages}
            keyExtractor={(item) => item.id}
            style={styles.list}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <Text style={styles.emptyText}>No matching language found</Text>
            }
            renderItem={({ item }) => {
              const isSelected = item.id === currentLang;
              return (
                <Pressable
                  onPress={() => handleChoose(item.id)}
                  style={({ pressed }) => [
                    styles.item,
                    isSelected && styles.itemSelected,
                    pressed && { opacity: 0.85 },
                  ]}
                >
                  <Text style={styles.flag}>{item.flag}</Text>
                  <View style={styles.itemBody}>
                    <Text style={styles.itemName} numberOfLines={1}>
                      {item.name}
                      {item.nativeName && item.nativeName !== item.name ? (
                        <Text style={styles.itemNative}> ({item.nativeName})</Text>
                      ) : null}
                    </Text>
                    <Text style={styles.itemTranslation} numberOfLines={1}>
                      {item.translation}
                    </Text>
                  </View>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={20} color={Palette.emeraldLight} />
                  )}
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
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    padding: 16,
  },
  sheet: {
    backgroundColor: Palette.bgDeep,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Palette.borderHover,
    padding: 16,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerLabel: {
    color: Palette.textSlate300,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  countBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  countText: {
    color: Palette.emeraldLight,
    fontSize: 10,
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
  searchWrap: {
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
    paddingVertical: 2,
  },
  list: {
    maxHeight: 420,
  },
  emptyText: {
    color: Palette.textDim,
    textAlign: 'center',
    paddingVertical: 24,
    fontSize: 13,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: 14,
    marginBottom: 4,
  },
  itemSelected: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  flag: {
    fontSize: 22,
  },
  itemBody: {
    flex: 1,
  },
  itemName: {
    color: Palette.textWhite,
    fontSize: 14,
    fontWeight: '600',
  },
  itemNative: {
    color: Palette.textMuted,
    fontWeight: '400',
    fontSize: 12,
  },
  itemTranslation: {
    color: Palette.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
});
