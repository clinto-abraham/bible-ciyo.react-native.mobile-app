import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LanguageMeta } from '@/lib/bible';
import { Palette } from '@/constants/palette';
import LanguagePickerModal from './LanguagePickerModal';

interface AppHeaderProps {
  currentLang: string;
  languages: LanguageMeta[];
  onSelectLang: (langId: string) => void;
  showBackToReader?: boolean;
}

export default function AppHeader({
  currentLang,
  languages,
  onSelectLang,
  showBackToReader = false,
}: AppHeaderProps) {
  const [langModalOpen, setLangModalOpen] = useState(false);
  const activeLang = languages.find((l) => l.id === currentLang) || languages[0];

  return (
    <>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.push('/')}
          style={styles.brandRow}
          accessibilityLabel="Sacred Scriptures Home"
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

        <View style={styles.rightRow}>
          {showBackToReader ? (
            <Pressable
              onPress={() => router.back()}
              style={styles.iconBtn}
              accessibilityLabel="Back"
            >
              <Ionicons name="arrow-back" size={18} color={Palette.textSlate200} />
            </Pressable>
          ) : (
            <Pressable
              onPress={() => router.push('/about')}
              style={styles.iconBtn}
              accessibilityLabel="About Sacred Scriptures"
            >
              <Ionicons name="information-circle-outline" size={20} color={Palette.textSlate200} />
            </Pressable>
          )}

          <Pressable
            onPress={() => setLangModalOpen(true)}
            style={styles.langPill}
            accessibilityLabel="Select language"
          >
            <Ionicons name="globe-outline" size={14} color={Palette.emeraldLight} />
            <Text style={styles.flag}>{activeLang?.flag || '🇬🇧'}</Text>
            <Text style={styles.langName} numberOfLines={1}>
              {activeLang?.name.split(' ')[0] || 'English'}
            </Text>
            <Ionicons name="chevron-down" size={13} color={Palette.textMuted} />
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
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: 'rgba(6, 8, 20, 0.94)',
    borderBottomWidth: 1,
    borderBottomColor: Palette.borderSubtle,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  emblemOuter: {
    width: 34,
    height: 34,
    borderRadius: 17,
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
    borderRadius: 15,
    backgroundColor: Palette.bgBase,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cross: {
    color: Palette.amber,
    fontSize: 13,
    fontWeight: '700',
  },
  brandTitle: {
    color: Palette.textWhite,
    fontSize: 14,
    fontWeight: '700',
  },
  brandSub: {
    color: Palette.textMuted,
    fontSize: 9,
    letterSpacing: 1.2,
    fontWeight: '600',
  },
  rightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Palette.bgCard,
    borderWidth: 1,
    borderColor: Palette.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  langPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: Palette.emerald,
    backgroundColor: Palette.bgCard,
  },
  flag: {
    fontSize: 14,
  },
  langName: {
    color: Palette.textWhite,
    fontSize: 12,
    fontWeight: '700',
    maxWidth: 74,
  },
});
