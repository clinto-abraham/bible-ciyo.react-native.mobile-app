import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { Verse } from '@/lib/bible';
import {
  FontSizeLevel,
  getBookmarks,
  subscribeBookmarks,
  toggleBookmark,
} from '@/lib/preferences';
import { Palette } from '@/constants/palette';
import AudioPlayButton from './AudioPlayButton';
import AudioSettingsModal from './AudioSettingsModal';
import TranslationModal from './TranslationModal';

interface VerseCardProps {
  verseData: Verse;
  book: string;
  bookName: string;
  chapter: number;
  lang: string;
  dir?: 'ltr' | 'rtl';
  isHighlighted?: boolean;
  fontSize?: FontSizeLevel;
  onSelect?: () => void;
}

export default function VerseCard({
  verseData,
  book,
  bookName,
  chapter,
  lang,
  dir = 'ltr',
  isHighlighted = false,
  fontSize = 'huge',
  onSelect,
}: VerseCardProps) {
  const [isLexiconOpen, setIsLexiconOpen] = useState(false);
  const [isVoiceSettingsOpen, setIsVoiceSettingsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  const verseId = `${book}-${chapter}-${verseData.verse}`;
  const isRtl = dir === 'rtl' || lang === 'hebrew' || lang === 'aramaic';

  useEffect(() => {
    const sync = () => {
      getBookmarks().then((list) => {
        setIsBookmarked(list.some((b) => b.id === verseId));
      });
    };
    sync();
    return subscribeBookmarks(sync);
  }, [verseId]);

  const handleToggleBookmark = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const added = await toggleBookmark({
      id: verseId,
      bookSlug: book,
      bookName,
      chapterNumber: chapter,
      verseNumber: verseData.verse,
      lang,
      textSnippet: verseData.text.slice(0, 80),
    });
    setIsBookmarked(added);
  };

  const handleCopySingle = async () => {
    await Clipboard.setStringAsync(`${verseData.verse} ${verseData.text}`);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getTypography = () => {
    const isAncientRtl = lang === 'hebrew' || lang === 'aramaic';
    if (fontSize === 'colossal') {
      return {
        fontSize: isAncientRtl ? 30 : 25,
        lineHeight: isAncientRtl ? 52 : 38,
      };
    }
    if (fontSize === 'normal') {
      return {
        fontSize: isAncientRtl ? 21 : 17,
        lineHeight: isAncientRtl ? 36 : 27,
      };
    }
    // huge (default)
    return {
      fontSize: isAncientRtl ? 26 : 21,
      lineHeight: isAncientRtl ? 45 : 33,
    };
  };

  const typo = getTypography();

  return (
    <>
      <Pressable
        onPress={onSelect}
        style={({ pressed }) => [
          styles.card,
          isHighlighted && styles.cardHighlighted,
          isRtl && styles.cardRtl,
          pressed && { opacity: 0.94 },
        ]}
      >
        {isHighlighted && (
          <View
            style={[
              styles.accentBar,
              isRtl ? { right: 6 } : { left: 6 },
            ]}
          />
        )}

        {/* Left / Top Verse Badge */}
        <View style={[styles.badgeCol, isRtl && { alignItems: 'flex-end' }]}>
          <View style={[styles.numPill, isHighlighted && styles.numPillHighlighted]}>
            <Text style={[styles.numText, isHighlighted && styles.numTextHighlighted]}>
              {verseData.verse}
            </Text>
          </View>
          {isHighlighted && (
            <View style={styles.focusTag}>
              <Ionicons name="star" size={9} color={Palette.amberLight} />
            </View>
          )}
          {isBookmarked && (
            <View style={styles.bmTag}>
              <Ionicons name="bookmark" size={9} color={Palette.emeraldLight} />
            </View>
          )}
        </View>

        {/* Verse Text */}
        <Text
          style={[
            styles.verseText,
            typo,
            { textAlign: isRtl ? 'right' : 'left' },
            isHighlighted && { color: '#FFFBEB' },
          ]}
        >
          {verseData.text}
        </Text>

        {/* Compact Icon Action Column */}
        <View style={styles.actionsCol}>
          <Pressable
            onPress={handleToggleBookmark}
            style={[styles.actionBtn, isBookmarked && styles.actionBtnBookmarked]}
            accessibilityLabel={isBookmarked ? 'Remove bookmark' : 'Bookmark verse'}
          >
            <Ionicons
              name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
              size={15}
              color={isBookmarked ? Palette.bgBase : Palette.textMuted}
            />
          </Pressable>

          <Pressable
            onPress={handleCopySingle}
            style={[styles.actionBtn, copied && styles.actionBtnCopied]}
            accessibilityLabel="Copy verse"
          >
            <Ionicons
              name={copied ? 'checkmark' : 'copy-outline'}
              size={15}
              color={copied ? Palette.emeraldLight : Palette.textSlate300}
            />
          </Pressable>

          <AudioPlayButton text={verseData.text} lang={lang} compact />

          <Pressable
            onPress={() => setIsVoiceSettingsOpen(true)}
            style={styles.actionBtn}
            accessibilityLabel="Voice settings"
          >
            <Ionicons name="options-outline" size={15} color={Palette.textMuted} />
          </Pressable>

          <Pressable
            onPress={() => setIsLexiconOpen(true)}
            style={styles.actionBtn}
            accessibilityLabel="Inspect lexicon and comparative translations"
          >
            <Ionicons name="information-circle-outline" size={16} color={Palette.amberLight} />
          </Pressable>
        </View>
      </Pressable>

      {isLexiconOpen && (
        <TranslationModal
          visible={isLexiconOpen}
          verseId={verseData.verse}
          book={book}
          chapter={chapter}
          lang={lang}
          initialText={verseData.text}
          onClose={() => setIsLexiconOpen(false)}
        />
      )}

      {isVoiceSettingsOpen && (
        <AudioSettingsModal
          isOpen={isVoiceSettingsOpen}
          onClose={() => setIsVoiceSettingsOpen(false)}
          currentLang={lang}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(30, 41, 59, 0.85)',
    backgroundColor: 'rgba(15, 23, 42, 0.48)',
    position: 'relative',
  },
  cardRtl: {
    flexDirection: 'row-reverse',
  },
  cardHighlighted: {
    borderColor: 'rgba(251, 191, 36, 0.85)',
    backgroundColor: 'rgba(120, 53, 15, 0.25)',
  },
  accentBar: {
    position: 'absolute',
    top: 12,
    bottom: 12,
    width: 4,
    borderRadius: 4,
    backgroundColor: Palette.gold,
  },
  badgeCol: {
    alignItems: 'flex-start',
    gap: 5,
    paddingTop: 2,
  },
  numPill: {
    minWidth: 30,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.8)',
    alignItems: 'center',
  },
  numPillHighlighted: {
    backgroundColor: Palette.gold,
    borderColor: Palette.amberLight,
  },
  numText: {
    color: Palette.sky,
    fontSize: 12,
    fontWeight: '700',
  },
  numTextHighlighted: {
    color: Palette.bgBase,
  },
  focusTag: {
    padding: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(120, 53, 15, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.5)',
  },
  bmTag: {
    padding: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(6, 78, 59, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.5)',
  },
  verseText: {
    flex: 1,
    color: Palette.textSlate100,
    paddingHorizontal: 2,
  },
  actionsCol: {
    gap: 6,
    alignItems: 'center',
  },
  actionBtn: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: 'rgba(30, 41, 59, 0.85)',
    borderWidth: 1,
    borderColor: Palette.borderHover,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnBookmarked: {
    backgroundColor: Palette.emerald,
    borderColor: Palette.emeraldLight,
  },
  actionBtnCopied: {
    backgroundColor: 'rgba(6, 78, 59, 0.85)',
    borderColor: Palette.emerald,
  },
});
