import { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { VerseDetails, getVerseDetails } from '@/lib/bible';
import { Palette } from '@/constants/palette';
import AudioPlayButton from './AudioPlayButton';
import WavingSkeleton from './WavingSkeleton';

interface TranslationModalProps {
  visible: boolean;
  verseId: number;
  book: string;
  chapter: number;
  lang: string;
  initialText: string;
  onClose: () => void;
}

export default function TranslationModal({
  visible,
  verseId,
  book,
  chapter,
  lang,
  initialText,
  onClose,
}: TranslationModalProps) {
  const [data, setData] = useState<VerseDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    let active = true;
    setLoading(true);
    setError(null);

    getVerseDetails(book, chapter, verseId, lang)
      .then((res) => {
        if (!active) return;
        if (!res) {
          setError('Unable to load translation details for this verse.');
        } else {
          setData(res);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err instanceof Error ? err.message : 'Error loading lexicon');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [visible, book, chapter, verseId, lang]);

  const copyText = async (text: string, id: string) => {
    if (!text) return;
    await Clipboard.setStringAsync(text);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const isRtl = lang === 'hebrew' || lang === 'aramaic';
  const isEnglishLang = (id: string) =>
    id === 'english' || id === 'english-bsb' || id === 'english-ylt';

  const displayedComparisons = (data?.comparisons || []).filter((comp) => {
    if (isEnglishLang(lang) && comp.langId === 'english') return false;
    if (lang === 'hebrew' && comp.langId === 'hebrew') return false;
    if (lang === 'aramaic' && comp.langId === 'aramaic') return false;
    if (lang === 'greek' && comp.langId === 'greek') return false;
    return true;
  });

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <View style={styles.badgeRow}>
                <View style={styles.amberPill}>
                  <Text style={styles.amberPillText}>LEXICON & HISTORY</Text>
                </View>
                <Text style={styles.refCode}>
                  {book.toUpperCase()} {chapter}:{verseId}
                </Text>
              </View>
              <Text style={styles.title}>
                {data ? `${data.bookName} ${data.chapter}:${data.verse}` : `${book} ${chapter}:${verseId}`}
                {data?.nativeName && data.nativeName !== data.bookName ? (
                  <Text style={styles.nativeTitle}> ({data.nativeName})</Text>
                ) : null}
              </Text>
            </View>

            <Pressable onPress={onClose} style={styles.closeBtn} accessibilityLabel="Close lexicon modal">
              <Ionicons name="close" size={20} color={Palette.textSlate300} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
            {loading ? (
              <WavingSkeleton lines={3} />
            ) : error ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={18} color="#F87171" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : (
              <>
                {/* Primary Card */}
                <View style={styles.primaryCard}>
                  <View style={styles.cardTopRow}>
                    <View style={styles.langBadge}>
                      <Text style={styles.langBadgeText}>{lang.toUpperCase()}</Text>
                    </View>
                    <View style={styles.actionRow}>
                      <AudioPlayButton
                        text={data?.primaryText || initialText}
                        lang={lang}
                        compact
                        showSettings
                      />
                      <Pressable
                        onPress={() => copyText(data?.primaryText || initialText, 'primary')}
                        style={[
                          styles.iconActionBtn,
                          copiedId === 'primary' && styles.iconActionBtnCopied,
                        ]}
                      >
                        <Ionicons
                          name={copiedId === 'primary' ? 'checkmark' : 'copy-outline'}
                          size={15}
                          color={copiedId === 'primary' ? Palette.emeraldLight : Palette.textSlate200}
                        />
                      </Pressable>
                    </View>
                  </View>

                  <Text
                    style={[
                      styles.primaryText,
                      { textAlign: isRtl ? 'right' : 'left' },
                    ]}
                  >
                    {data?.primaryText || initialText}
                  </Text>

                  {data?.transliteration ? (
                    <Text style={styles.translitText}>{data.transliteration}</Text>
                  ) : null}
                </View>

                {/* Comparative Codices */}
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>COMPARATIVE CODICES</Text>
                </View>

                {displayedComparisons.map((comp) => {
                  const isCompRtl = comp.dir === 'rtl';
                  const isCopied = copiedId === comp.langId;
                  return (
                    <View
                      key={comp.langId}
                      style={[
                        styles.compCard,
                        {
                          backgroundColor: comp.theme.bg,
                          borderColor: comp.theme.border,
                        },
                      ]}
                    >
                      <View style={styles.compHeader}>
                        <View style={{ flex: 1, gap: 4 }}>
                          <View
                            style={[
                              styles.compBadge,
                              {
                                backgroundColor: comp.theme.badgeBg,
                                borderColor: comp.theme.badgeBorder,
                              },
                            ]}
                          >
                            <Text style={[styles.compBadgeText, { color: comp.theme.badgeText }]}>
                              {comp.badge}
                            </Text>
                          </View>
                          <Text style={styles.compName}>{comp.name}</Text>
                        </View>

                        {comp.available && comp.text ? (
                          <View style={styles.actionRow}>
                            <AudioPlayButton text={comp.text} lang={comp.langId} compact />
                            <Pressable
                              onPress={() => copyText(comp.text, comp.langId)}
                              style={[
                                styles.iconActionBtn,
                                {
                                  backgroundColor: comp.theme.copyBg,
                                  borderColor: comp.theme.copyBorder,
                                },
                                isCopied && styles.iconActionBtnCopied,
                              ]}
                            >
                              <Ionicons
                                name={isCopied ? 'checkmark' : 'copy-outline'}
                                size={15}
                                color={isCopied ? Palette.emeraldLight : comp.theme.copyText}
                              />
                            </Pressable>
                          </View>
                        ) : null}
                      </View>

                      {comp.available && comp.text ? (
                        <Text
                          style={[
                            styles.compText,
                            {
                              color: comp.theme.textColor,
                              textAlign: isCompRtl ? 'right' : 'left',
                            },
                          ]}
                        >
                          {comp.text}
                        </Text>
                      ) : (
                        <View style={styles.unavailRow}>
                          <Ionicons name="information-circle-outline" size={14} color={Palette.textMuted} />
                          <Text style={styles.unavailText}>
                            {comp.unavailableReason || 'Text not available in this codex.'}
                          </Text>
                        </View>
                      )}
                    </View>
                  );
                })}

                {/* Lexical Breakdown */}
                {data?.breakdown && data.breakdown.length > 0 ? (
                  <View style={{ gap: 10 }}>
                    <Text style={styles.sectionTitle}>LEXICAL BREAKDOWN & MORPHOLOGY</Text>
                    {data.breakdown.map((item, idx) => (
                      <View key={idx} style={styles.lexCard}>
                        <View style={styles.lexTop}>
                          <Text style={styles.lexWord}>{item.hebrew}</Text>
                          <Text style={styles.lexTranslit}>{item.transliteration}</Text>
                        </View>
                        <Text style={styles.lexMeaning}>{item.meaning}</Text>
                        <Text style={styles.lexGrammar}>{item.grammar}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}

                {/* Manuscript Notes */}
                {data?.manuscriptNotes ? (
                  <View style={styles.notesCard}>
                    <View style={styles.notesHeader}>
                      <Ionicons name="document-text-outline" size={15} color={Palette.amber} />
                      <Text style={styles.notesTitle}>Codex Manuscript Notes</Text>
                    </View>
                    <Text style={styles.notesText}>{data.manuscriptNotes}</Text>
                    <Text style={styles.notesSub}>{data.codexSource}</Text>
                  </View>
                ) : null}
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.82)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Palette.bgDeep,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderColor: Palette.borderSubtle,
    maxHeight: '92%',
    paddingTop: 18,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: Palette.borderSubtle,
    paddingBottom: 14,
    marginBottom: 14,
    gap: 10,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  amberPill: {
    backgroundColor: 'rgba(120, 53, 15, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.5)',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
  },
  amberPillText: {
    color: Palette.amber,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  refCode: {
    color: Palette.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  title: {
    color: Palette.textWhite,
    fontSize: 21,
    fontWeight: '600',
  },
  nativeTitle: {
    color: Palette.textMuted,
    fontSize: 15,
    fontWeight: '400',
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Palette.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollBody: {
    gap: 14,
    paddingBottom: 34,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(127, 29, 29, 0.35)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 13,
    flex: 1,
  },
  primaryCard: {
    padding: 18,
    borderRadius: 22,
    backgroundColor: Palette.bgCard,
    borderWidth: 1,
    borderColor: Palette.borderSubtle,
    gap: 12,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Palette.borderSubtle,
    paddingBottom: 10,
  },
  langBadge: {
    backgroundColor: Palette.bgSurface,
    borderWidth: 1,
    borderColor: Palette.borderHover,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  langBadgeText: {
    color: Palette.textSlate300,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconActionBtn: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: 'rgba(30, 41, 59, 0.85)',
    borderWidth: 1,
    borderColor: Palette.borderHover,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconActionBtnCopied: {
    backgroundColor: 'rgba(6, 78, 59, 0.8)',
    borderColor: Palette.emerald,
  },
  primaryText: {
    color: Palette.textWhite,
    fontSize: 21,
    lineHeight: 34,
  },
  translitText: {
    color: Palette.amberLight,
    fontSize: 13,
    fontStyle: 'italic',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Palette.borderSubtle,
  },
  sectionHeader: {
    marginTop: 4,
  },
  sectionTitle: {
    color: Palette.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  compCard: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    gap: 10,
  },
  compHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(30, 41, 59, 0.6)',
    paddingBottom: 10,
    gap: 8,
  },
  compBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  compBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  compName: {
    color: Palette.textSlate300,
    fontSize: 12,
    fontWeight: '600',
  },
  compText: {
    fontSize: 18,
    lineHeight: 30,
  },
  unavailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  unavailText: {
    color: Palette.textMuted,
    fontSize: 12,
    fontStyle: 'italic',
    flex: 1,
  },
  lexCard: {
    padding: 12,
    borderRadius: 14,
    backgroundColor: Palette.bgBase,
    borderWidth: 1,
    borderColor: Palette.borderSubtle,
    gap: 4,
  },
  lexTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lexWord: {
    color: Palette.textWhite,
    fontSize: 18,
    fontWeight: '600',
  },
  lexTranslit: {
    color: Palette.amber,
    fontSize: 12,
    fontWeight: '600',
  },
  lexMeaning: {
    color: Palette.textSlate200,
    fontSize: 13,
    fontWeight: '500',
  },
  lexGrammar: {
    color: Palette.textDim,
    fontSize: 11,
  },
  notesCard: {
    padding: 14,
    borderRadius: 16,
    backgroundColor: Palette.bgCard,
    borderWidth: 1,
    borderColor: Palette.borderSubtle,
    gap: 6,
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  notesTitle: {
    color: Palette.textSlate200,
    fontSize: 12,
    fontWeight: '700',
  },
  notesText: {
    color: Palette.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
  notesSub: {
    color: Palette.textDim,
    fontSize: 11,
    fontStyle: 'italic',
  },
});
