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
import { setPreferredLanguage } from '@/lib/preferences';
import { Palette } from '@/constants/palette';

interface LanguageDropdownProps {
  currentLang: string;
  languages: LanguageMeta[];
  onSelectLanguage: (langId: string) => void;
  compact?: boolean;
}

export default function LanguageDropdown({
  currentLang,
  languages,
  onSelectLanguage,
  compact = false,
}: LanguageDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const activeLang = languages.find((l) => l.id === currentLang) || languages[0];

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

  const handleSelect = async (langId: string) => {
    setIsOpen(false);
    setSearchQuery('');
    await setPreferredLanguage(langId);
    onSelectLanguage(langId);
  };

  return (
    <>
      <Pressable
        onPress={() => setIsOpen(true)}
        style={({ pressed }) => [
          styles.trigger,
          compact && styles.triggerCompact,
          pressed && { opacity: 0.85 },
        ]}
        accessibilityLabel="Select Bible Language"
      >
        <Ionicons name="globe-outline" size={15} color={Palette.emeraldLight} />
        <Text style={styles.flag}>{activeLang?.flag || '🇬🇧'}</Text>
        <Text style={styles.triggerText} numberOfLines={1}>
          {activeLang?.name.split(' ')[0] || 'English'}
        </Text>
        <Ionicons name="chevron-down" size={14} color={Palette.textMuted} />
      </Pressable>

      <Modal
        visible={isOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setIsOpen(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.sheetLabel}>SELECT LANGUAGE / ഭാഷ</Text>
                <Text style={styles.sheetSub}>{languages.length} Sacred Codices Available</Text>
              </View>
              <Pressable onPress={() => setIsOpen(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color={Palette.textSlate300} />
              </Pressable>
            </View>

            <View style={styles.searchBox}>
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
                <Pressable onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={16} color={Palette.textMuted} />
                </Pressable>
              )}
            </View>

            <FlatList
              data={filteredLanguages}
              keyExtractor={(item) => item.id}
              style={styles.list}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => {
                const isSelected = item.id === currentLang;
                return (
                  <Pressable
                    onPress={() => handleSelect(item.id)}
                    style={({ pressed }) => [
                      styles.optionRow,
                      isSelected && styles.optionRowSelected,
                      pressed && { opacity: 0.8 },
                    ]}
                  >
                    <Text style={styles.optionFlag}>{item.flag}</Text>
                    <View style={styles.optionInfo}>
                      <Text style={styles.optionName} numberOfLines={1}>
                        {item.name}
                        {item.nativeName && item.nativeName !== item.name
                          ? ` (${item.nativeName})`
                          : ''}
                      </Text>
                      <Text style={styles.optionTranslation} numberOfLines={1}>
                        {item.translation}
                      </Text>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={20} color={Palette.emeraldLight} />
                    )}
                  </Pressable>
                );
              }}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No matching language found</Text>
              }
            />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: Palette.emerald,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
  },
  triggerCompact: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  flag: {
    fontSize: 15,
  },
  triggerText: {
    color: Palette.textWhite,
    fontSize: 13,
    fontWeight: '600',
    maxWidth: 85,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
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
  sheetLabel: {
    color: Palette.textSlate300,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  sheetSub: {
    color: Palette.emeraldLight,
    fontSize: 11,
    marginTop: 2,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
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
    paddingVertical: 2,
  },
  list: {
    flexGrow: 0,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: 14,
    marginBottom: 4,
  },
  optionRowSelected: {
    backgroundColor: 'rgba(16, 185, 129, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  optionFlag: {
    fontSize: 22,
  },
  optionInfo: {
    flex: 1,
  },
  optionName: {
    color: Palette.textWhite,
    fontSize: 14,
    fontWeight: '600',
  },
  optionTranslation: {
    color: Palette.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  emptyText: {
    color: Palette.textDim,
    textAlign: 'center',
    paddingVertical: 24,
    fontSize: 13,
  },
});
