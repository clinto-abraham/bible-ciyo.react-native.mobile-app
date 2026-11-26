import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LanguageMeta } from '@/lib/bible';
import { Palette } from '@/constants/palette';

interface LanguageCardProps {
  language: LanguageMeta;
  isSelected: boolean;
  onSelect: (langId: string) => void;
}

export default function LanguageCard({
  language,
  isSelected,
  onSelect,
}: LanguageCardProps) {
  return (
    <Pressable
      onPress={() => onSelect(language.id)}
      style={({ pressed }) => [
        styles.card,
        isSelected && styles.cardSelected,
        pressed && { opacity: 0.85 },
      ]}
    >
      <View>
        <View style={styles.topRow}>
          <Text style={styles.flag}>{language.flag}</Text>
          {isSelected && (
            <View style={styles.activePill}>
              <Text style={styles.activeText}>ACTIVE</Text>
            </View>
          )}
        </View>
        <Text style={styles.name} numberOfLines={2}>
          {language.name}
        </Text>
        <Text style={styles.native} numberOfLines={1}>
          {language.nativeName}
        </Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.booksCount}>{language.booksCount} Books</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    padding: 13,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Palette.borderSubtle,
    backgroundColor: 'rgba(15, 23, 42, 0.52)',
    justifyContent: 'space-between',
    minHeight: 122,
  },
  cardSelected: {
    borderColor: 'rgba(56, 189, 248, 0.65)',
    backgroundColor: 'rgba(30, 58, 138, 0.25)',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  flag: {
    fontSize: 22,
  },
  activePill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: 'rgba(6, 78, 59, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.5)',
  },
  activeText: {
    color: Palette.emeraldLight,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  name: {
    color: Palette.textWhite,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  native: {
    color: Palette.textMuted,
    fontSize: 11,
  },
  footer: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(30, 41, 59, 0.7)',
  },
  booksCount: {
    color: Palette.amber,
    fontSize: 11,
    fontWeight: '600',
  },
});
