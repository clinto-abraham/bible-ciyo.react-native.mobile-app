import { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { ChapterData, Verse } from '@/lib/bible';
import {
  BookmarkItem,
  FontSizeLevel,
  getBookmarks,
  getFontSize,
  setFontSize as saveFontSize,
  subscribeBookmarks,
} from '@/lib/preferences';
import { speakText, stopAudio } from '@/lib/audio';
import { Palette } from '@/constants/palette';
import VerseCard from './VerseCard';
import AudioSettingsModal from './AudioSettingsModal';

interface ChapterReaderProps {
  data: ChapterData;
  initialVerse?: number | null;
  onJumpToBookmark: (bookSlug: string, chapter: number, verse: number) => void;
  ListHeaderComponent?: React.ReactElement;
}

export default function ChapterReader({
  data,
  initialVerse,
  onJumpToBookmark,
  ListHeaderComponent,
}: ChapterReaderProps) {
  const [selectedVerse, setSelectedVerse] = useState<number | null>(initialVerse ?? null);
  const [rangeStart, setRangeStart] = useState<number>(initialVerse ?? 1);
  const [rangeEnd, setRangeEnd] = useState<number>(
    initialVerse ?? Math.min(10, data.verses.length)
  );
  const [isRangeMode, setIsRangeMode] = useState(false);

  const [fontSize, setFontSize] = useState<FontSizeLevel>('huge');
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [isPlayingChapter, setIsPlayingChapter] = useState(false);
  const [isAudioSettingsOpen, setIsAudioSettingsOpen] = useState(false);
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [activeBookmarkIdx, setActiveBookmarkIdx] = useState(0);

  const flatListRef = useRef<FlatList<Verse>>(null);
  const activePlayIndexRef = useRef<number | null>(null);

  useEffect(() => {
    getFontSize().then(setFontSize);
  }, []);

  useEffect(() => {
    const syncBm = () => {
      getBookmarks().then((list) => {
        setBookmarks(list);
        if (list.length > 0) {
          setActiveBookmarkIdx((prev) => Math.min(prev, list.length - 1));
        }
      });
    };
    syncBm();
    return subscribeBookmarks(syncBm);
  }, []);

  useEffect(() => {
    setSelectedVerse(initialVerse ?? null);
    if (initialVerse) {
      setTimeout(() => scrollToVerse(initialVerse), 250);
    }
  }, [initialVerse, data.bookSlug, data.chapterNumber]);

  useEffect(() => {
    return () => {
      stopAudio();
      activePlayIndexRef.current = null;
    };
  }, [data.bookSlug, data.chapterNumber]);

  const scrollToVerse = (verseNum: number) => {
    const idx = data.verses.findIndex((v) => v.verse === verseNum);
    if (idx !== -1 && flatListRef.current) {
      try {
        flatListRef.current.scrollToIndex({
          index: idx,
          animated: true,
          viewPosition: 0.25,
        });
      } catch {
        // ignore if list hasn't measured yet
      }
    }
  };

  const stopChapterAudio = () => {
    stopAudio();
    setIsPlayingChapter(false);
    activePlayIndexRef.current = null;
  };

  const playVerseAtIndex = (index: number, versesList: Verse[]) => {
    if (index >= versesList.length) {
      stopChapterAudio();
      return;
    }
    const currentV = versesList[index];
    setSelectedVerse(currentV.verse);
    scrollToVerse(currentV.verse);
    activePlayIndexRef.current = index;

    speakText(currentV.text, data.language, {
      onEnd: () => {
        if (activePlayIndexRef.current === index) {
          setTimeout(() => {
            if (activePlayIndexRef.current === index) {
              playVerseAtIndex(index + 1, versesList);
            }
          }, 300);
        }
      },
      onError: () => {
        stopChapterAudio();
      },
    });
  };

  const handleTogglePlayChapter = () => {
    if (isPlayingChapter) {
      stopChapterAudio();
      return;
    }

    let targetVerses = data.verses;
    if (isRangeMode) {
      const start = Math.min(rangeStart, rangeEnd);
      const end = Math.max(rangeStart, rangeEnd);
      targetVerses = data.verses.filter((v) => v.verse >= start && v.verse <= end);
    } else if (selectedVerse !== null) {
      const startIdx = data.verses.findIndex((v) => v.verse === selectedVerse);
      if (startIdx !== -1) targetVerses = data.verses.slice(startIdx);
    }

    if (targetVerses.length > 0) {
      setIsPlayingChapter(true);
      playVerseAtIndex(0, targetVerses);
    }
  };

  const handleNextBookmark = () => {
    if (bookmarks.length === 0) return;
    const nextIdx = (activeBookmarkIdx + 1) % bookmarks.length;
    setActiveBookmarkIdx(nextIdx);
    const target = bookmarks[nextIdx];
    if (target.bookSlug === data.bookSlug && target.chapterNumber === data.chapterNumber) {
      setSelectedVerse(target.verseNumber);
      scrollToVerse(target.verseNumber);
    } else {
      onJumpToBookmark(target.bookSlug, target.chapterNumber, target.verseNumber);
    }
  };

  const handlePrevBookmark = () => {
    if (bookmarks.length === 0) return;
    const prevIdx = (activeBookmarkIdx - 1 + bookmarks.length) % bookmarks.length;
    setActiveBookmarkIdx(prevIdx);
    const target = bookmarks[prevIdx];
    if (target.bookSlug === data.bookSlug && target.chapterNumber === data.chapterNumber) {
      setSelectedVerse(target.verseNumber);
      scrollToVerse(target.verseNumber);
    } else {
      onJumpToBookmark(target.bookSlug, target.chapterNumber, target.verseNumber);
    }
  };

  const handleSelectVerse = (vNum: number) => {
    Haptics.selectionAsync();
    if (isRangeMode) {
      if (vNum < rangeStart) setRangeStart(vNum);
      else setRangeEnd(vNum);
    } else {
      setSelectedVerse(vNum);
      setRangeStart(vNum);
      setRangeEnd(vNum);
      scrollToVerse(vNum);
    }
  };

  const handleClearSelection = () => {
    setSelectedVerse(null);
    setIsRangeMode(false);
  };

  const handleCopy = async (type: 'all' | 'range') => {
    let versesToCopy: Verse[] = [];
    let titleHeader = '';

    if (type === 'all') {
      versesToCopy = data.verses;
      titleHeader = `${data.bookName} ${data.chapterNumber} (${data.translation})`;
    } else if (isRangeMode) {
      const start = Math.min(rangeStart, rangeEnd);
      const end = Math.max(rangeStart, rangeEnd);
      versesToCopy = data.verses.filter((v) => v.verse >= start && v.verse <= end);
      titleHeader = `${data.bookName} ${data.chapterNumber}:${start}-${end} (${data.translation})`;
    } else if (selectedVerse !== null) {
      versesToCopy = data.verses.filter((v) => v.verse === selectedVerse);
      titleHeader = `${data.bookName} ${data.chapterNumber}:${selectedVerse} (${data.translation})`;
    } else {
      versesToCopy = data.verses;
      titleHeader = `${data.bookName} ${data.chapterNumber} (${data.translation})`;
    }

    const formatted = [titleHeader, '', ...versesToCopy.map((v) => `${v.verse} ${v.text}`)].join(
      '\n'
    );
    await Clipboard.setStringAsync(formatted);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopyFeedback(`Copied ${versesToCopy.length} verse${versesToCopy.length === 1 ? '' : 's'}`);
    setTimeout(() => setCopyFeedback(null), 2800);
  };

  const cycleFontSize = (dir: 'up' | 'down') => {
    let next: FontSizeLevel = fontSize;
    if (dir === 'up') {
      next = fontSize === 'normal' ? 'huge' : 'colossal';
    } else {
      next = fontSize === 'colossal' ? 'huge' : 'normal';
    }
    setFontSize(next);
    saveFontSize(next);
  };

  const isVerseHighlighted = (vNum: number) => {
    if (isRangeMode) {
      const start = Math.min(rangeStart, rangeEnd);
      const end = Math.max(rangeStart, rangeEnd);
      return vNum >= start && vNum <= end;
    }
    return selectedVerse === vNum;
  };

  const renderToolbar = () => (
    <View style={styles.toolbarCard}>
      {/* Row 1: Focus Status + Bookmarks */}
      <View style={styles.toolbarRow}>
        <View style={styles.statusLeft}>
          {selectedVerse !== null || isRangeMode ? (
            <View style={styles.focusGroup}>
              <View style={styles.focusPill}>
                <Ionicons name="star" size={11} color={Palette.amberLight} />
                <Text style={styles.focusPillText}>
                  {isRangeMode
                    ? `${Math.min(rangeStart, rangeEnd)}–${Math.max(rangeStart, rangeEnd)}`
                    : `v.${selectedVerse}`}
                </Text>
              </View>
              <Pressable
                onPress={() => scrollToVerse(selectedVerse || rangeStart)}
                style={styles.miniIconBtn}
                accessibilityLabel="Scroll to focused verse"
              >
                <Ionicons name="locate-outline" size={14} color={Palette.textSlate200} />
              </Pressable>
              <Pressable
                onPress={handleClearSelection}
                style={styles.miniIconBtn}
                accessibilityLabel="Clear selection"
              >
                <Ionicons name="close" size={14} color="#FDA4AF" />
              </Pressable>
            </View>
          ) : (
            <View style={styles.fullChapterBadge}>
              <Ionicons name="book-outline" size={13} color={Palette.sky} />
              <Text style={styles.fullChapterText}>{data.verses.length} vv</Text>
            </View>
          )}

          {bookmarks.length > 0 && (
            <View style={styles.bmBar}>
              <Ionicons name="bookmark" size={12} color={Palette.emeraldLight} />
              <Text style={styles.bmCount}>{bookmarks.length}</Text>
              <Pressable onPress={handlePrevBookmark} style={styles.bmStepBtn} hitSlop={6}>
                <Ionicons name="chevron-back" size={12} color={Palette.emeraldLight} />
              </Pressable>
              <Text style={styles.bmIdx}>#{activeBookmarkIdx + 1}</Text>
              <Pressable onPress={handleNextBookmark} style={styles.bmStepBtn} hitSlop={6}>
                <Ionicons name="chevron-forward" size={12} color={Palette.emeraldLight} />
              </Pressable>
            </View>
          )}
        </View>
      </View>

      {/* Row 2: Compact Icon Action Bar (Copy, Range, Listen, Voice, Font Size) */}
      <View style={styles.actionsRow}>
        {/* Copy + Range Group */}
        <View style={styles.pillGroup}>
          <Pressable
            onPress={() => handleCopy('all')}
            style={styles.groupBtn}
            accessibilityLabel="Copy full chapter"
          >
            <Ionicons name="copy-outline" size={15} color={Palette.textSlate200} />
            <Text style={styles.groupBtnLabel}>All</Text>
          </Pressable>

          <Pressable
            onPress={() => {
              const next = !isRangeMode;
              setIsRangeMode(next);
              if (next && selectedVerse) {
                setRangeStart(selectedVerse);
                setRangeEnd(Math.min(selectedVerse + 4, data.verses.length));
              }
            }}
            style={[styles.groupBtn, isRangeMode && styles.groupBtnActive]}
            accessibilityLabel="Toggle verse range selection"
          >
            <Ionicons
              name="git-compare-outline"
              size={14}
              color={isRangeMode ? Palette.amberLight : Palette.textMuted}
            />
            <Text style={[styles.groupBtnLabel, isRangeMode && { color: Palette.amberLight }]}>
              1–N
            </Text>
          </Pressable>

          {(selectedVerse !== null || isRangeMode) && (
            <Pressable
              onPress={() => handleCopy('range')}
              style={styles.copyRangeBtn}
              accessibilityLabel="Copy selected verses"
            >
              <Ionicons name="copy" size={13} color={Palette.textWhite} />
              <Text style={styles.copyRangeText}>
                {isRangeMode
                  ? `${Math.min(rangeStart, rangeEnd)}–${Math.max(rangeStart, rangeEnd)}`
                  : `v.${selectedVerse}`}
              </Text>
            </Pressable>
          )}
        </View>

        {/* Audio Listen + Settings Group */}
        <View style={styles.pillGroup}>
          <Pressable
            onPress={handleTogglePlayChapter}
            style={[styles.groupBtn, isPlayingChapter && styles.groupBtnActive]}
            accessibilityLabel={isPlayingChapter ? 'Stop audio' : 'Listen to chapter'}
          >
            <Ionicons
              name={isPlayingChapter ? 'stop-circle' : 'volume-high-outline'}
              size={16}
              color={isPlayingChapter ? Palette.amberLight : Palette.amber}
            />
            <Text style={[styles.groupBtnLabel, isPlayingChapter && { color: Palette.amberLight }]}>
              {isPlayingChapter ? 'Stop' : 'Listen'}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setIsAudioSettingsOpen(true)}
            style={styles.groupBtn}
            accessibilityLabel="Audio voice settings"
          >
            <Ionicons name="options-outline" size={15} color={Palette.textMuted} />
          </Pressable>
        </View>

        {/* Font Size Group */}
        <View style={styles.pillGroup}>
          <Pressable onPress={() => cycleFontSize('down')} style={styles.groupBtn}>
            <Text style={styles.fontBtnText}>A-</Text>
          </Pressable>
          <Text style={styles.fontLabel}>
            {fontSize === 'normal' ? 'M' : fontSize === 'huge' ? 'L' : 'XL'}
          </Text>
          <Pressable onPress={() => cycleFontSize('up')} style={styles.groupBtn}>
            <Text style={styles.fontBtnText}>A+</Text>
          </Pressable>
        </View>
      </View>

      {/* Range Presets Bar */}
      {isRangeMode && (
        <View style={styles.rangeBar}>
          <Text style={styles.rangeLabel}>
            Range: {Math.min(rangeStart, rangeEnd)}–{Math.max(rangeStart, rangeEnd)}
          </Text>
          <View style={styles.rangePresets}>
            <Pressable
              onPress={() => {
                setRangeStart(1);
                setRangeEnd(Math.min(5, data.verses.length));
              }}
              style={styles.presetBtn}
            >
              <Text style={styles.presetText}>1–5</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setRangeStart(1);
                setRangeEnd(Math.min(12, data.verses.length));
              }}
              style={styles.presetBtn}
            >
              <Text style={styles.presetText}>1–12</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setRangeStart(1);
                setRangeEnd(data.verses.length);
              }}
              style={styles.presetBtn}
            >
              <Text style={styles.presetText}>All</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Horizontal Verse Jump Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsScroll}
      >
        <Ionicons name="arrow-down-circle-outline" size={14} color={Palette.textDim} />
        {data.verses.map((v) => {
          const highlighted = isVerseHighlighted(v.verse);
          return (
            <Pressable
              key={v.verse}
              onPress={() => handleSelectVerse(v.verse)}
              style={[styles.chip, highlighted && styles.chipHighlighted]}
            >
              <Text style={[styles.chipText, highlighted && styles.chipTextHighlighted]}>
                {v.verse}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );

  return (
    <View style={styles.root}>
      <FlatList
        ref={flatListRef}
        data={data.verses}
        keyExtractor={(item) => String(item.verse)}
        contentContainerStyle={styles.listContent}
        onScrollToIndexFailed={() => {}}
        ListHeaderComponent={
          <View style={{ gap: 14, marginBottom: 14 }}>
            {ListHeaderComponent}
            {renderToolbar()}
          </View>
        }
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        renderItem={({ item }) => (
          <VerseCard
            verseData={item}
            book={data.bookSlug}
            bookName={data.bookName}
            chapter={data.chapterNumber}
            lang={data.language}
            dir={data.dir}
            isHighlighted={isVerseHighlighted(item.verse)}
            fontSize={fontSize}
            onSelect={() => handleSelectVerse(item.verse)}
          />
        )}
      />

      {copyFeedback && (
        <View style={styles.toast}>
          <Ionicons name="checkmark-circle" size={16} color={Palette.emeraldLight} />
          <Text style={styles.toastText}>{copyFeedback}</Text>
        </View>
      )}

      <AudioSettingsModal
        isOpen={isAudioSettingsOpen}
        onClose={() => setIsAudioSettingsOpen(false)}
        currentLang={data.language}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    position: 'relative',
  },
  listContent: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 40,
  },
  toolbarCard: {
    padding: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(11, 15, 30, 0.92)',
    borderWidth: 1,
    borderColor: Palette.borderSubtle,
    gap: 10,
  },
  toolbarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  focusGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  focusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(245, 158, 11, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.5)',
  },
  focusPillText: {
    color: Palette.amberLight,
    fontSize: 11,
    fontWeight: '700',
  },
  miniIconBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Palette.bgCard,
    borderWidth: 1,
    borderColor: Palette.borderHover,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullChapterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  fullChapterText: {
    color: Palette.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  bmBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(6, 78, 59, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.45)',
  },
  bmCount: {
    color: Palette.emeraldLight,
    fontSize: 11,
    fontWeight: '700',
  },
  bmStepBtn: {
    paddingHorizontal: 2,
  },
  bmIdx: {
    color: Palette.emeraldLight,
    fontSize: 10,
    fontWeight: '700',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 6,
  },
  pillGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.bgCard,
    borderWidth: 1,
    borderColor: Palette.borderSubtle,
    borderRadius: 14,
    padding: 3,
    gap: 2,
  },
  groupBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 10,
  },
  groupBtnActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  groupBtnLabel: {
    color: Palette.textSlate200,
    fontSize: 11,
    fontWeight: '600',
  },
  copyRangeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: Palette.blue600,
  },
  copyRangeText: {
    color: Palette.textWhite,
    fontSize: 11,
    fontWeight: '700',
  },
  fontBtnText: {
    color: Palette.textSlate200,
    fontSize: 12,
    fontWeight: '700',
  },
  fontLabel: {
    color: Palette.textDim,
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 2,
  },
  rangeBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Palette.borderSubtle,
  },
  rangeLabel: {
    color: Palette.amberLight,
    fontSize: 11,
    fontWeight: '700',
  },
  rangePresets: {
    flexDirection: 'row',
    gap: 6,
  },
  presetBtn: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: Palette.bgCard,
    borderWidth: 1,
    borderColor: Palette.borderHover,
  },
  presetText: {
    color: Palette.textSlate300,
    fontSize: 11,
    fontWeight: '600',
  },
  chipsScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Palette.borderSubtle,
  },
  chip: {
    minWidth: 28,
    height: 28,
    paddingHorizontal: 7,
    borderRadius: 9,
    backgroundColor: Palette.bgCard,
    borderWidth: 1,
    borderColor: Palette.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipHighlighted: {
    backgroundColor: Palette.gold,
    borderColor: Palette.amberLight,
  },
  chipText: {
    color: Palette.textSlate300,
    fontSize: 11,
    fontWeight: '700',
  },
  chipTextHighlighted: {
    color: Palette.bgBase,
  },
  toast: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: 'rgba(6, 78, 59, 0.95)',
    borderWidth: 1,
    borderColor: Palette.emerald,
  },
  toastText: {
    color: '#D1FAE5',
    fontSize: 13,
    fontWeight: '600',
  },
});
