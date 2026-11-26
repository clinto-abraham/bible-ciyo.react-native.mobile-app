import { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import {
  AudioSettings,
  LANGUAGE_LOCALES,
  VoiceGender,
  detectVoiceGender,
  getAvailableVoicesForLang,
  getStoredAudioSettings,
  isAudioSpeaking,
  saveAudioSettings,
  speakText,
  stopAudio,
  subscribeAudioSettings,
} from '@/lib/audio';
import { Palette } from '@/constants/palette';

interface AudioSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLang: string;
}

const SAMPLE_TEXTS: Record<string, string> = {
  hebrew: 'בְּרֵאשִׁית בָּרָא אֱלֹהִים אֵת הַשָּׁמַיִם וְאֵת הָאָרֶץ.',
  english: 'The Lord is my shepherd; I shall not want.',
  'english-bsb': 'The Lord is my shepherd; I shall not want.',
  'english-ylt': 'Jehovah is my shepherd, I do not lack.',
  malayalam: 'ആദിയിൽ ദൈവം ആകാശവും ഭൂമിയും സൃഷ്ടിച്ചു.',
  greek: 'Ἐν ἀρχῇ ἦν ὁ Λόγος, καὶ ὁ Λόγος ἦν πρὸς τὸν Θεόν.',
  aramaic: 'ܒܪܫܝܬ ܐܝܬܘܗܝ ܗܘܐ ܡܠܬܐ',
  latin: 'In principio creavit Deus caelum et terram.',
  german: 'Im Anfang schuf Gott die Himmel und die Erde.',
  french: 'Au commencement, Dieu créa les cieux et la terre.',
  spanish: 'En el principio creó Dios los cielos y la tierra.',
  russian: 'В начале сотворил Бог небо и землю.',
  chinese: '起初，神创造天地。',
  burmese: 'အစအဦး၌ ဘုရားသခင်သည် ကောင်းကင်နှင့် မြေကြီးကို ဖန်ဆင်းတော်မူ၏။',
  slavic: 'Въ нача́лѣ сотвори́ Бо́гъ не́бо и зе́млю.',
};

const SPEED_OPTIONS = [
  { rate: 0.8, label: '0.8x Slow' },
  { rate: 0.92, label: '0.9x Reverent' },
  { rate: 1.0, label: '1.0x Normal' },
  { rate: 1.15, label: '1.15x Brisk' },
];

export default function AudioSettingsModal({
  isOpen,
  onClose,
  currentLang,
}: AudioSettingsModalProps) {
  const [settings, setSettings] = useState<AudioSettings>({
    gender: 'auto',
    rate: 0.92,
    preferredVoiceIdentifier: null,
  });
  const [availableVoices, setAvailableVoices] = useState<Speech.Voice[]>([]);
  const [isPlayingTest, setIsPlayingTest] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    getStoredAudioSettings().then(setSettings);
    getAvailableVoicesForLang(currentLang).then(setAvailableVoices);
    return subscribeAudioSettings(setSettings);
  }, [isOpen, currentLang]);

  useEffect(() => {
    if (!isOpen && isPlayingTest) {
      stopAudio();
      setIsPlayingTest(false);
    }
  }, [isOpen, isPlayingTest]);

  const handleGenderChange = async (gender: VoiceGender) => {
    const updated = await saveAudioSettings({ gender, preferredVoiceIdentifier: null });
    setSettings(updated);
  };

  const handleVoiceSelect = async (identifier: string | null) => {
    const updated = await saveAudioSettings({ preferredVoiceIdentifier: identifier });
    setSettings(updated);
  };

  const handleRateChange = async (rate: number) => {
    const updated = await saveAudioSettings({ rate });
    setSettings(updated);
  };

  const handlePlayTest = async () => {
    if (isPlayingTest || (await isAudioSpeaking())) {
      await stopAudio();
      setIsPlayingTest(false);
      return;
    }

    setIsPlayingTest(true);
    const text = SAMPLE_TEXTS[currentLang] || SAMPLE_TEXTS.english;
    await speakText(text, currentLang, {
      rate: settings.rate,
      gender: settings.gender,
      voiceIdentifier: settings.preferredVoiceIdentifier,
      onStart: () => setIsPlayingTest(true),
      onEnd: () => setIsPlayingTest(false),
      onError: () => setIsPlayingTest(false),
    });
  };

  const langLabel = LANGUAGE_LOCALES[currentLang]?.label || currentLang;

  return (
    <Modal visible={isOpen} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconBox}>
                <Ionicons name="volume-high" size={18} color={Palette.amber} />
              </View>
              <View>
                <Text style={styles.title}>Audio & Voice Settings</Text>
                <Text style={styles.subtitle}>
                  Saved on device for <Text style={{ color: Palette.amberLight }}>{langLabel}</Text>
                </Text>
              </View>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={18} color={Palette.textSlate300} />
            </Pressable>
          </View>

          {/* Gender */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>VOICE GENDER</Text>
            <View style={styles.row3}>
              {(['auto', 'female', 'male'] as VoiceGender[]).map((g) => {
                const active = settings.gender === g;
                return (
                  <Pressable
                    key={g}
                    onPress={() => handleGenderChange(g)}
                    style={[styles.chipBtn, active && styles.chipBtnActive]}
                  >
                    <Ionicons
                      name={g === 'auto' ? 'sparkles' : g === 'female' ? 'woman' : 'man'}
                      size={14}
                      color={active ? Palette.bgBase : Palette.textSlate300}
                    />
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>
                      {g === 'auto' ? 'Auto' : g === 'female' ? 'Female' : 'Male'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Device Voices */}
          <View style={styles.section}>
            <View style={styles.labelRow}>
              <Text style={styles.sectionLabel}>DEVICE VOICE</Text>
              <Text style={styles.countText}>{availableVoices.length} detected</Text>
            </View>
            {availableVoices.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                <Pressable
                  onPress={() => handleVoiceSelect(null)}
                  style={[
                    styles.voicePill,
                    !settings.preferredVoiceIdentifier && styles.voicePillActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.voicePillText,
                      !settings.preferredVoiceIdentifier && { color: Palette.bgBase, fontWeight: '700' },
                    ]}
                  >
                    Auto Natural
                  </Text>
                </Pressable>
                {availableVoices.map((v) => {
                  const active = settings.preferredVoiceIdentifier === v.identifier;
                  const gTag = detectVoiceGender(v);
                  return (
                    <Pressable
                      key={v.identifier}
                      onPress={() => handleVoiceSelect(v.identifier)}
                      style={[styles.voicePill, active && styles.voicePillActive]}
                    >
                      <Text
                        style={[
                          styles.voicePillText,
                          active && { color: Palette.bgBase, fontWeight: '700' },
                        ]}
                      >
                        {v.name} {gTag !== 'unknown' ? `(${gTag[0].toUpperCase()})` : ''}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            ) : (
              <View style={styles.fallbackBox}>
                <Text style={styles.fallbackText}>
                  Using device speech engine with phonetic fallback for {langLabel}.
                </Text>
              </View>
            )}
          </View>

          {/* Speed */}
          <View style={styles.section}>
            <View style={styles.labelRow}>
              <Text style={styles.sectionLabel}>READING SPEED</Text>
              <Text style={styles.rateValue}>{settings.rate}x</Text>
            </View>
            <View style={styles.row4}>
              {SPEED_OPTIONS.map((opt) => {
                const active = Math.abs(settings.rate - opt.rate) < 0.03;
                return (
                  <Pressable
                    key={opt.rate}
                    onPress={() => handleRateChange(opt.rate)}
                    style={[styles.speedBtn, active && styles.speedBtnActive]}
                  >
                    <Text style={[styles.speedText, active && styles.speedTextActive]}>
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Actions */}
          <View style={styles.footer}>
            <Pressable
              onPress={handlePlayTest}
              style={[styles.previewBtn, isPlayingTest && styles.previewBtnPlaying]}
            >
              <Ionicons
                name={isPlayingTest ? 'stop-circle' : 'play'}
                size={16}
                color={isPlayingTest ? Palette.amberLight : Palette.textWhite}
              />
              <Text style={[styles.previewText, isPlayingTest && { color: Palette.amberLight }]}>
                {isPlayingTest ? 'Stop Preview' : 'Preview Voice'}
              </Text>
            </Pressable>
            <Pressable onPress={onClose} style={styles.doneBtn}>
              <Text style={styles.doneText}>Done</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    justifyContent: 'center',
    padding: 18,
  },
  card: {
    backgroundColor: Palette.bgDeep,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: Palette.borderHover,
    padding: 20,
    gap: 18,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Palette.borderSubtle,
    paddingBottom: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: Palette.textWhite,
    fontSize: 16,
    fontWeight: '700',
  },
  subtitle: {
    color: Palette.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Palette.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    gap: 8,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionLabel: {
    color: Palette.textSlate300,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.9,
  },
  countText: {
    color: Palette.textDim,
    fontSize: 11,
  },
  rateValue: {
    color: Palette.amber,
    fontSize: 12,
    fontWeight: '700',
  },
  row3: {
    flexDirection: 'row',
    gap: 8,
  },
  chipBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: Palette.bgCard,
    borderWidth: 1,
    borderColor: Palette.borderSubtle,
  },
  chipBtnActive: {
    backgroundColor: Palette.gold,
    borderColor: Palette.amberLight,
  },
  chipText: {
    color: Palette.textSlate300,
    fontSize: 12,
    fontWeight: '600',
  },
  chipTextActive: {
    color: Palette.bgBase,
    fontWeight: '700',
  },
  voicePill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: Palette.bgCard,
    borderWidth: 1,
    borderColor: Palette.borderSubtle,
  },
  voicePillActive: {
    backgroundColor: Palette.gold,
    borderColor: Palette.amberLight,
  },
  voicePillText: {
    color: Palette.textSlate200,
    fontSize: 12,
  },
  fallbackBox: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: Palette.bgCardSoft,
    borderWidth: 1,
    borderColor: Palette.borderSubtle,
  },
  fallbackText: {
    color: Palette.textMuted,
    fontSize: 12,
  },
  row4: {
    flexDirection: 'row',
    gap: 6,
  },
  speedBtn: {
    flex: 1,
    paddingVertical: 9,
    paddingHorizontal: 4,
    borderRadius: 12,
    backgroundColor: Palette.bgCard,
    borderWidth: 1,
    borderColor: Palette.borderSubtle,
    alignItems: 'center',
  },
  speedBtnActive: {
    backgroundColor: Palette.gold,
    borderColor: Palette.amberLight,
  },
  speedText: {
    color: Palette.textSlate300,
    fontSize: 11,
    fontWeight: '600',
  },
  speedTextActive: {
    color: Palette.bgBase,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Palette.borderSubtle,
  },
  previewBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: Palette.blue600,
  },
  previewBtnPlaying: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderWidth: 1,
    borderColor: Palette.amber,
  },
  previewText: {
    color: Palette.textWhite,
    fontSize: 13,
    fontWeight: '700',
  },
  doneBtn: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: Palette.bgCard,
    borderWidth: 1,
    borderColor: Palette.borderHover,
    justifyContent: 'center',
  },
  doneText: {
    color: Palette.textSlate200,
    fontSize: 13,
    fontWeight: '600',
  },
});
